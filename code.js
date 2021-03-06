﻿//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

//Load resource from Google

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

google.charts.load('current', {packages: ['corechart']});

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

//Load from browser cache

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

var option_menu = localStorage['option_menu'] || "options";
var option_colorFilter = localStorage['option_colorFilter'] || "all";
var option_rangeFilter = localStorage['option_rangeFilter'] || "all";
var option_typeFilter = localStorage['option_typeFilter'] || "all";
var option_viewFilter = localStorage['option_viewFilter'] || "all";
var option_sortOrder = localStorage['option_sortOrder'] || "worst";
var option_showOnlyMaxSkills = localStorage['option_showOnlyMaxSkills'] || "true";
var option_showOnlyDuelSkills = localStorage['option_showOnlyDuelSkills'] || "true";
var option_autoCalculate = localStorage['option_autoCalculate'] || "true";
var option_saveSettings = localStorage['option_saveSettings'] || "true";
var option_saveFilters = localStorage['option_saveFilters'] || "false";

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

//Load JSON from database

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

var data = {};

// Load JSON text from server hosted file and return JSON parsed object
function loadJSON(filePath) {
	// Load JSON file;
	var json = loadTextFileAjaxSync(filePath, "application/json");
	// Parse JSON
	return JSON.parse(json);
}

// Load text with Ajax synchronously: takes path to file and optional MIME type
function loadTextFileAjaxSync(filePath, mimeType)
{
	var xmlhttp = new XMLHttpRequest();
	//Using synchronous request
	xmlhttp.open("GET", filePath, false);
	if (mimeType != null) {
		if (xmlhttp.overrideMimeType) {
			xmlhttp.overrideMimeType(mimeType);
		}
	}
	try {
		xmlhttp.send();
	}catch(error) {
		console.log("Invalid target address.");
		return null
	}

	if (xmlhttp.status == 200)
	{
		return xmlhttp.responseText;
	}else {
		console.log("Invalid xmlhttp.status.");
		return null;
	}
}

data.heroes = loadJSON('json/hero.json');
data.heroSkills = loadJSON('json/hero_skill.json');
data.skills = loadJSON('json/skill.json');
data.prereqs = loadJSON('json/skill_prereq.json');
data.refine = loadJSON('json/weapon_refine.json');
data.lists = loadJSON('json/custom_lists.json')

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

//Initialize variables and data structure

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

var debug = false;

data.weaponTypes = ["sword","lance","axe","redtome","bluetome","greentome","dragon","redbow","bluebow","greenbow","graybow","bow","reddagger","bluedagger","greendagger","graydagger","dagger","staff"];
data.rangedWeapons = ["redtome","bluetome","greentome","redbow","bluebow","greenbow","graybow","bow","reddagger","bluedagger","greendagger","graydagger","dagger","staff"];
data.meleeWeapons = ["sword","lance","axe","dragon"];
data.physicalWeapons = ["sword","lance","axe","redbow","bluebow","greenbow","graybow","bow","reddagger","bluedagger","greendagger","graydagger","dagger"];
data.magicalWeapons = ["redtome","bluetome","greentome","dragon","staff"];
data.moveTypes = ["infantry","armored","flying","cavalry","mounted"];
data.colors = ["red","blue","green","gray"];
data.skillSlots = ["weapon","refine","assist","special","a","b","c","s"];
data.buffTypes = ["buffs","debuffs","spur"];
data.buffStats = ["hp","atk","spd","def","res"];
data.stats = ["hp","atk","spd","def","res"];
data.support = ["s","s-","a","a-","b","b-","c","c-"];
data.blessType = ["atk","spd","def","res"];

//Growth shifts of 3 are what make some banes/boons +/- 4
//growth table from https://feheroes.wiki/Stat_Growth
data.growths = [
	[6,	8,	9,	11,	13,	14,	16,	18,	19,	21,	23,	24,	26],
	[7,	8,	10,	12,	14,	15,	17,	19,	21,	23,	25,	26,	28],
	[7,	9,	11,	13,	15,	17,	19,	21,	23,	25,	27,	29,	31,	33],
	[8,	10,	12,	14,	16,	18,	20,	22,	24,	26,	28,	31,	33,	35],
	[8,	10,	13,	15,	17,	19,	22,	24,	26,	28,	30,	33,	35,	37]
	];

//Remember: heroes, skills, prereqs, and heroskills arrays come from PHP-created script

//Sort hero array by name
data.heroes.sort(function(a,b){
	//console.log(a.name + ", " + b.name + ": " + a.name>b.name);
	return (a.name.toLowerCase() > b.name.toLowerCase())*2-1;
})

//Sort skills array by name
data.skills.sort(function(a,b){
	//console.log(a.name + ", " + b.name + ": " + a.name>b.name);
	return (a.name.toLowerCase() + a.slot > b.name.toLowerCase() + b.slot)*2-1;
})

data.heroPossibleSkills = [];
data.heroBaseSkills = [];
data.heroMaxSkills = [[],[],[],[],[]]; //2d array; 1st num rarity, 2nd num skillindex

data.skillsThatArePrereq = [];
//Prereq exceptions are:
//Sol, Ardent Sacrifice, Luna, Astra, Assault, Sacred Cowl,
//Armorslayer+, Killing Edge+, Raudrwolf+, Heavy Spear+, Killer Lance+, Blarwolf+, Rexcalibur+
//Wo Dao+, Bolganone+, Hammer+, Killer Axe+, Gronnwolf+, Assassin's Bow+, Killer Bow+
data.skillPrereqExceptions = [
	125, 137, 162, 168, 170, 193,
	6, 10, 38, 74, 76, 87,
	14, 28, 50, 52, 64,	107, 111, 424
	];

data.enemyPrompts = {
	//Just for fun, special messages for some of my favorites ;)
	"default":"Enemies to fight:",
	"Effie":"Who to crush:",
	"Karel":"Time to feast:",
	"Nino":"Do my best:",
	"Sharena":"My turn!:"
}

//Make list of all skill ids that are a strictly inferior prereq to exclude from dropdown boxes
for(var i = 0; i < data.prereqs.length;i++){
	if(data.skillsThatArePrereq.indexOf(data.prereqs[i].required_id)==-1 && data.skillPrereqExceptions.indexOf(data.prereqs[i].required_id)==-1){
		data.skillsThatArePrereq.push(data.prereqs[i].required_id);
	}
}

//Find hero skills
for(var i = 0; i < data.heroes.length;i++){
	data.heroPossibleSkills.push(getValidSkills({index:i}));
	var baseSkills = getHeroSkills(i);
	data.heroBaseSkills.push(baseSkills);
	for(var j = 0; j < 5; j++){
		data.heroMaxSkills[j].push(getMaxSkills(baseSkills,j));
	}
}

function initOptions(){
	//Initializes options from localStorage or from scratch

	//Holder for options that aren't hero-specific
	options = {};
	options.saveSettings = true;
	options.autoCalculate = true;
	options.buffStartTurn = 1;
	options.debuffStartTurn = 1;
	//options.threatenRule = "Neither";
	options.ployBehavior = "Orthogonal";
	options.showOnlyMaxSkills = true;
	options.hideUnaffectingSkills = true;
	options.colorFilter = "all";
	options.rangeFilter = "all";
	options.typeFilter = "all";
	options.viewFilter = "all";
	options.sortOrder = "worst";
	options.customEnemyList = 0;
	options.customEnemySelected = -1;
	options.roundInitiators = ["Challenger","Enemy"];

	//Holder for side-specific options
	options.chilled_challenger = false;
	options.chilled_enemy = false;
	options.panic_challenger = false;
	options.panic_enemy = false;
	options.rush_challenger = false;
	options.rush_enemy = false;
	options.flash_challenger = false;
	options.flash_enemy = false;
	options.pulse_challenger = false;
	options.pulse_enemy = false;
	options.movement_challenger = false;
	options.movement_enemy = false;
	options.harsh_command_challenger = false;
	options.harsh_command_enemy = false;
	options.candlelight_challenger = false;
	options.candlelight_enemy = false;
	options.defensive_challenger = false;
	options.defensive_enemy = false;
	options.close_def_challenger = false;
	options.close_def_enemy = false;
	options.distant_def_challenger = false;
	options.distant_def_enemy = false;
	options.threaten_challenger = false;
	options.threaten_enemy = false;
	options.galeforce_challenger = true;
	options.galeforce_enemy = true;
	options.sweep_challenger = true;
	options.sweep_enemy = true;
	options.odd_buff_challenger = true;
	options.odd_buff_enemy = true;

	//Holder for statistic values;
	options.chartType = "enemies by color";
	statistics = {};
	statistics.challenger = {};
	statistics.enemies = {};
	statistics.challenger.res_hp_max = -1;
	statistics.challenger.res_hp_min = -1;
	statistics.challenger.res_hp_avg = -1;
	statistics.enemies.res_hp_max = -1;
	statistics.enemies.res_hp_min = -1;
	statistics.enemies.res_hp_avg = -1;
	statistics.enemies.list = [];
	statistics.enemies.red = 0;
	statistics.enemies.red_outcome = [0,0,0];
	statistics.enemies.blue = 0;
	statistics.enemies.blue_outcome = [0,0,0];
	statistics.enemies.green = 0;
	statistics.enemies.green_outcome = [0,0,0];
	statistics.enemies.gray = 0;
	statistics.enemies.gray_outcome = [0,0,0];
	statistics.enemies.infantry = 0;
	statistics.enemies.infantry_outcome = [0,0,0];
	statistics.enemies.armored = 0;
	statistics.enemies.armored_outcome = [0,0,0];
	statistics.enemies.flying = 0;
	statistics.enemies.flying_outcome = [0,0,0];
	statistics.enemies.cavalry = 0;
	statistics.enemies.cavalry_outcome = [0,0,0];
	statistics.enemies.melee = 0;
	statistics.enemies.melee_outcome = [0,0,0];
	statistics.enemies.ranged = 0;
    statistics.enemies.ranged_outcome = [0,0,0];

    statistics.wins = { min: 0, average: 0, max: 0, count: 0};
    statistics.losses = { min: 0, average: 0, max: 0, count: 0};
    statistics.inconclusives_challenger = { min: 0, average: 0, max: 0, count: 0};
    statistics.inconclusives_enemy = { min: 0, average: 0, max: 0, count: 0};

	//Holder for challenger options and pre-calculated stats
	challenger = {};

	challenger.challenger = true;
	challenger.index = -1;
	challenger.merge = 0;
	challenger.rarity = 5;
	challenger.boon = "none";
	challenger.bane = "none";
	challenger.summoner = "none";
	challenger.ally = "none";
	challenger.bless_1 = "none";
	challenger.bless_2 = "none";
	challenger.bless_3 = "none";

	//The following 6 arrays will be set from arrays generated in the heroes array so they don't have to be re-calculated
	challenger.naturalSkills = []; //Skills the hero has without having to inherit
	challenger.validWeaponSkills = [];
	challenger.validRefineSkills = [];
	challenger.validAssistSkills = [];
	challenger.validSpecialSkills = [];
	challenger.validASkills = [];
	challenger.validBSkills = [];
	challenger.validCSkills = [];

	challenger.weapon = -1;
	challenger.refine = -1;
	challenger.assist = -1;
	challenger.special = -1;
	challenger.a = -1;
	challenger.b = -1;
	challenger.c = -1;
	challenger.s = -1;

	challenger.statOffset = {"hp":0,"atk":0,"spd":0,"def":0,"res":0};
	challenger.hp = 0;
	challenger.atk = 0;
	challenger.spd = 0;
	challenger.def = 0;
	challenger.res = 0;

	challenger.bst = 0;
	challenger.spt = 0;

	challenger.buffs = {"hp":0,"atk":0,"spd":0,"def":0,"res":0};
	challenger.debuffs = {"hp":0,"atk":0,"spd":0,"def":0,"res":0};
	challenger.spur = {"hp":0,"atk":0,"spd":0,"def":0,"res":0};

	challenger.currenthp = 0;
	challenger.damage = 0;
	challenger.HpPercent = 4;
	challenger.precharge = 0;
	challenger.adjacent = 1;
	challenger.adjacent2 = 1;
	challenger.adjacent_foe = 1;
	challenger.adjacent2_foe = 1;
	challenger.movementbuff = "hone";

	//Holder for enemy options and pre-calculated stats
	enemies = {};
	enemies.fl = {}; //Full list
	enemies.fl.isFl = true;
	enemies.fl.list = []; //May not actually use - might be too much redundant data

	enemies.fl.include = {"melee":1,"ranged":1,"red":1,"blue":1,"green":1,"gray":1,"physical":1,"magical":1,"infantry":1,"cavalry":1,"flying":1,"armored":1,"staff":0,"nonstaff":1};

	enemies.fl.merge = 0;
	enemies.fl.rarity = 5;
	enemies.fl.boon = "none";
	enemies.fl.bane = "none";
	enemies.fl.summoner = "none";
	enemies.fl.ally = "none";
	enemies.fl.bless_1 = "none";
	enemies.fl.bless_2 = "none";
	enemies.fl.bless_3 = "none";

	enemies.fl.naturalSkills = [];
	enemies.fl.validWeaponSkills = getValidSkills(enemies.fl,"weapon");
	enemies.fl.validRefineSkills = getValidSkills(enemies.fl,"refine");
	enemies.fl.validAssistSkills = getValidSkills(enemies.fl,"assist");
	enemies.fl.validSpecialSkills = getValidSkills(enemies.fl,"special");
	enemies.fl.validASkills = getValidSkills(enemies.fl,"a");
	enemies.fl.validBSkills = getValidSkills(enemies.fl,"b");
	enemies.fl.validCSkills = getValidSkills(enemies.fl,"c");
	enemies.fl.validSSkills = getValidSkills(enemies.fl,"s");

	enemies.fl.avgHp = 0;
	enemies.fl.avgAtk = 0;
	enemies.fl.avgSpd = 0;
	enemies.fl.avgDef = 0;
	enemies.fl.avgRes = 0;

	enemies.fl.weapon = -1;
	enemies.fl.refine = -1;
	enemies.fl.assist = -1;
	enemies.fl.special = -1;
	enemies.fl.a = -1;
	enemies.fl.b = -1;
	enemies.fl.c = -1;
	enemies.fl.s = -1;
	enemies.fl.replaceWeapon = 0;
	enemies.fl.replaceRefine = 0;
	enemies.fl.replaceAssist = 0;
	enemies.fl.replaceSpecial = 0;
	enemies.fl.replaceA = 0;
	enemies.fl.replaceB = 0;
	enemies.fl.replaceC = 0;

	enemies.fl.buffs = {"hp":0,"atk":0,"spd":0,"def":0,"res":0};
	enemies.fl.debuffs = {"hp":0,"atk":0,"spd":0,"def":0,"res":0};
	enemies.fl.spur = {"hp":0,"atk":0,"spd":0,"def":0,"res":0};

	enemies.fl.damage = 0;
	enemies.fl.precharge = 0;
	enemies.fl.adjacent = 1;
	enemies.fl.adjacent2 = 1;
	enemies.fl.adjacent_foe = 1;
	enemies.fl.adjacent2_foe = 1;

	enemies.cl = {}; //Custom list
	enemies.cl.list = [];

	enemies.cl.avgHp = 0;
	enemies.cl.avgAtk = 0;
	enemies.cl.avgSpd = 0;
	enemies.cl.avgDef = 0;
	enemies.cl.avgRes = 0;
	enemies.cl.hp = 0;
	enemies.cl.atk = 0;
	enemies.cl.spd = 0;
	enemies.cl.def = 0;
	enemies.cl.res = 0;

	//Custom List Adjustments
	enemies.cl.merges = 0;
	enemies.cl.damages = 0;
	enemies.cl.HpPercent = 4;
	enemies.cl.status = "all";
	enemies.cl.statusbuff = 4;
	enemies.cl.movement = "all";
	enemies.cl.movementbuff = "hone";

	// //now set stored values
	// //(setting and resetting just in case new options are defined)
	// var storedOptions = JSON.parse(localStorage.getItem("options"));
	// var storedChallenger = JSON.parse(localStorage.getItem("challenger"));
	// var storedEnemies = JSON.parse(localStorage.getItem("enemies"));

	// replaceRecursive(options,storedOptions);
	// replaceRecursive(challenger,storedChallenger);
	// replaceRecursive(enemies,storedEnemies);

	if(options.customEnemySelected >= enemies.cl.list.length){
		options.customEnemySelected = enemies.cl.list.length - 1;
	}
}

initOptions();

var fightResults = []; //Needs to be global variable to get info for tooltip
var resultHTML = []; //Needs to be a global variable to flip sort order without

var showingTooltip = false;
var calcuwaiting = false;
var calcuwaitTime = 0;

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

//Put DOM stuff in place

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

$(document).ready(function(){
	//Show incompatibility message: code does not work fr IE<9
	//(Analytics show that the % of people who use IE<9 on my site is EXTREMELY low, like 1 in 30,000)
	if(![].forEach){
		console.log("Unsupported JavaScript");
		$("#update_text").html("Your browser does not appear to support some of the code this app uses (JavaScript ES5). The app probably won't work.");
	}

	//Load or Reset Settings
	if (option_saveSettings == "false"){initSettings();}

	//Populate hero select options
	var heroHTML = "<option value=-1 class=\"hero_option\">Select Hero</option>";
	for(var i = 0; i < data.heroes.length; i++){
		heroHTML += "<option value=" + i + " class=\"hero_option\">" + data.heroes[i].name + "</option>";
	}

	//Initiate hero lists
	var listHTML = "<option value=-1 class=\"hero_option\">New List</option>";

	//Inject select2 UI with matcher for hero lists
	$("#challenger_list, #cl_enemy_list").html(listHTML).select2({selectOnClose: true, dropdownAutoWidth : true, matcher: matchStartHeroesList});
	//Inject select2 UI with matcher for data.heroes
	$("#challenger_name, #cl_enemy_name").html(heroHTML).select2({selectOnClose: true, dropdownAutoWidth : true, matcher: matchStartHeroes});
	//Inject select2 UI with matcher for data.skills
	$("#challenger_weapon, #challenger_assist, #challenger_special, #challenger_a, #challenger_b, #challenger_c, #challenger_s").select2({selectOnClose: true, dropdownAutoWidth : true, matcher: matchStartSkills});
	$("#enemies_weapon, #enemies_assist, #enemies_special, #enemies_a, #enemies_b, #enemies_c, #enemies_s").select2({selectOnClose: true, dropdownAutoWidth : true, matcher: matchStartSkills});
	$("#cl_enemy_weapon, #cl_enemy_assist, #cl_enemy_special, #cl_enemy_a, #cl_enemy_b, #cl_enemy_c, #cl_enemy_s").select2({selectOnClose: true, dropdownAutoWidth : true, matcher: matchStartSkills});
	$("#enemies_weapon, #enemies_assist, #enemies_special, #enemies_a, #enemies_b, #enemies_c, #enemies_s").select2({selectOnClose: true, dropdownAutoWidth : true, matcher: matchStartSkills});
	//Inject select2 UI with matcher for data.refine
	$("#challenger_refine, #enemies_refine, #cl_enemy_refine, #enemies_refine").select2({selectOnClose: true, dropdownAutoWidth : true, matcher: matchStartRefine});
	//Inject select2 UI for Full List overwrite options
	$("#enemies_weapon_overwrite, #enemies_assist_overwrite, #enemies_special_overwrite, #enemies_a_overwrite, #enemies_b_overwrite, #enemies_c_overwrite").select2({selectOnClose: true, dropdownAutoWidth : true, minimumResultsForSearch: -1});

	//Load Custom Lists
	listHTML = "<option value=0> Filtered Full List</option>";
	listHTML += "<option value=1> Custom List</option>";
	for(var i = 0; i < data.lists.length; i++){
		listHTML += "<option value=" + (i + 2) + ">" + data.lists[i].name + "</option>";
	}
	$("#enemies_mode").html(listHTML).select2({dropdownAutoWidth : true, width: '145px'});

	//Set Options UI
	showOptions(option_menu);
	$('input:radio[class=menu_button][value=' + option_menu + ']').prop('checked', true);

	//Set filter UI
	if (option_saveFilters == "true"){
		options.colorFilter = option_colorFilter;
		$('#color_results').val(option_colorFilter).trigger('change.select2');
		options.rangeFilter = option_rangeFilter;
		$('#range_results').val(option_rangeFilter).trigger('change.select2');
		options.typeFilter = option_typeFilter;
		$('#type_results').val(option_typeFilter).trigger('change.select2');
		options.viewFilter = option_viewFilter;
		$('#view_results').val(option_viewFilter).trigger('change.select2');
		options.sortOrder = option_sortOrder;
		$('#sort_results').val(option_sortOrder).trigger('change.select2');
	}else{
		resetFilter();
	}

	//Set chart UI
	//TODO: cache this as well
	$('#chart_type').val("enemies by color").trigger('change.select2');

	//Set Settings UI
	$('#saveSettings').prop('checked', (option_saveSettings == "true"));
	options.showOnlyMaxSkills = (option_showOnlyMaxSkills == "true");
	$('#rules_prereqs').prop('checked', (option_showOnlyMaxSkills == "true"));
	options.hideUnaffectingSkills = (option_showOnlyDuelSkills == "true");
	$('#rules_hideunaffecting').prop('checked', (option_showOnlyDuelSkills == "true"));
	options.autoCalculate = (option_autoCalculate == "true");
	$('#autoCalculate').prop('checked', (option_autoCalculate == "true"));

	setSkillOptions(enemies.fl);
	initEnemyList();
	updateFullUI();

	//Create listener on whole body and check data-var to see which var to replace
	//TODO: make click listeners work similarly
	$("input, select").on("change", function(e){
		var dataVar = $(this).attr("data-var");
		if(dataVar){
			var varsThatChangeStats = [
				".buffs.hp",".debuffs.hp",".rarity",".merge",".boon",".bane",".summoner",".ally",".bless_1",".bless_2",".bless_3",".weapon",".refine",".a",".s",".replaceWeapon",".replaceRefine",".replaceA"
			];
			var varsThatChangeSkills = [
				".rarity",".replaceWeapon",".replaceRefine",".replaceAssist",".replaceSpecial",".replaceA",".replaceB",".replaceC","enemies.fl.weapon","enemies.fl.refine",
				"enemies.fl.assist","enemies.fl.special","enemies.fl.a","enemies.fl.b","enemies.fl.c","enemies.fl.s"
			];
			var varsThatUpdateFl = [
				".boon",".bane",".summoner",".ally",".bless_1",".bless_2",".bless_2",".precharge",".adjacent",".adjacent2",".adjacent_foe",".adjacent2_foe",".damage",".rarity",".merge"
			]

			var newVal = $(this).val();
			var useCalcuwait = false;
			var blockCalculate = false;

			var hero;
			if(beginsWith(dataVar,"challenger.")){
				hero = challenger;
			}
			else if(beginsWith(dataVar,"enemies.fl")){
				hero = enemies.fl;
			}
			else if(beginsWith(dataVar,"enemies.cl.list")){
				if(options.customEnemySelected == -1){
					addClEnemy();
				}
				hero = enemies.cl.list[options.customEnemySelected];
			}

			var inputType = $(this).attr("type");
			if(inputType == "number"){
				var min = $(this).attr("min");
				var max = $(this).attr("max");
				useCalcuwait = true;
				if(typeof min != "undefined" && typeof max != "undefined"){
					newVal = verifyNumberInput(this,min,max);
				}
				else{
					newVal = parseInt(newVal);
				}
			}
			else if(inputType == "checkbox"){
				newVal = $(this).is(":checked");
			}

			//Change val to numeric if it looks numeric
			//All numbers used by this program are ints
			if($.isNumeric(newVal)){
				newVal = parseInt(newVal);
			}

			changeDataVar(dataVar,newVal);

			//Stuff specific to changing skill
			if(endsWith(dataVar,".weapon") || endsWith(dataVar,".assist")|| endsWith(dataVar,".special") || endsWith(dataVar,".a") || endsWith(dataVar,".b") || endsWith(dataVar,".c") || endsWith(dataVar,".s")){
				if(newVal != -1){
					//***This does nothing?***
					var dataToPass = data.skills[newVal].name;
					if(endsWith(dataVar,".s")){
						//Rename s skills to differentate from regular skills
						dataToPass = "s_" + dataToPass;
					}
					//***This does nothing?***
				}
			}

			//Stuff specific to changing weapon option
			if(endsWith(dataVar,".weapon")){
				//Update refine options
				updateRefineUI(hero);
				hero.refine = -1;
			}

			//Stuff specific to changing chart type
			if(endsWith(dataVar,".chartType")){
				drawChart();
				blockCalculate = true;
			}

			//Stuff specific to changing hero
			if(endsWith(dataVar,".index")){
				if(newVal != -1){
					//find hero's starting skills
					initHero(hero);

					if(hero.challenger){

					}
					else{
						updateClList();
					}
				}
			}
			else if(endsWith(dataVar,".showOnlyMaxSkills") || endsWith(dataVar,".hideUnaffectingSkills")){
				blockCalculate = true;
				updateChallengerUI();
				updateEnemyUI();
				//Not hero so won't automatically update uis
			}
			else if(endsWith(dataVar,".viewFilter") || endsWith(dataVar,".sortOrder")){
				blockCalculate = true;
			}
			else if(endsWith(dataVar,".autoCalculate")){
				if(newVal == 0){
					blockCalculate = true;
				}
			}

			//Stuff specific to changing filter
			if(endsWith(dataVar,".colorFilter")){
				localStorage['option_colorFilter'] = newVal;
			}
			if(endsWith(dataVar,".rangeFilter")){
				localStorage['option_rangeFilter'] = newVal;
			}
			if(endsWith(dataVar,".typeFilter")){
				localStorage['option_typeFilter'] = newVal;
			}
			if(endsWith(dataVar,".viewFilter")){
				localStorage['option_viewFilter'] = newVal;
			}
			if(endsWith(dataVar,".sortOrder")){
				localStorage['option_sortOrder'] = newVal;
			}
			/*TODO: chartType cache
			if(endsWith(dataVar,".chartType")){
				localStorage['option_chartType'] = newVal;
			}
			*/

			//Cache Settings
			if(endsWith(dataVar,".showOnlyMaxSkills")){
				localStorage['option_showOnlyMaxSkills'] = (options.showOnlyMaxSkills ? "true" : "false");
			}
			if(endsWith(dataVar,".hideUnaffectingSkills")){
				localStorage['option_showOnlyDuelSkills'] = (options.hideUnaffectingSkills ? "true" : "false");
			}
			if(endsWith(dataVar,".autoCalculate")){
				localStorage['option_autoCalculate'] = (options.autoCalculate ? "true" : "false");
			}
			if(endsWith(dataVar,".saveSettings")){
				localStorage['option_saveSettings'] = (options.saveSettings ? "true" : "false");
			}
			if(endsWith(dataVar,".saveFilters")){
				localStorage['option_saveFilters'] = (options.saveFilters ? "true" : "false");
			}

			for(var i = 0; i < varsThatUpdateFl.length; i++){
				if(endsWith(dataVar,varsThatUpdateFl[i])){
					updateFlEnemies();
					break;
				}
			}

			for(var i = 0; i < varsThatChangeSkills.length; i++){
				if(endsWith(dataVar,varsThatChangeSkills[i])){
					setSkills(hero);
					break;
				}
			}

			for(var i = 0; i < varsThatChangeStats.length; i++){
				if(endsWith(dataVar,varsThatChangeStats[i])){
					setStats(hero);
					break;
				}
			}

			//Update custom enemy when list changes
			if (endsWith(dataVar, ".customEnemySelected")){
				updateEnemyUI();
				//Scroll to middle of list
				$('#cl_enemylist_list').scrollTop((options.customEnemySelected - 6.5) * 25 - 10);
			}

			//Update health
			if (endsWith(dataVar, ".currenthp") && hero){
				updateHealth(newVal, hero);
			}

			//Update adjacent units values
			if (endsWith(dataVar, ".adjacent") || endsWith(dataVar, ".adjacent2") || endsWith(dataVar, ".adjacent_foe") || endsWith(dataVar, ".adjacent2_foe")){
				updateAdjacentValues(dataVar, hero);
			}

			//Update special charge
			if (endsWith(dataVar, ".pulse_challenger") && challenger){
				updateChallengerUI();
			}
			if (endsWith(dataVar, ".pulse_enemy")){
				updateEnemyUI();
			}

			if(hero && hero.challenger){
				updateChallengerUI();
			}
			else if(typeof hero != "undefined"){
				updateEnemyUI();
			}

			if(!blockCalculate){
				if(useCalcuwait){
					calcuWait(300);
				}
				else{
					calculate();
				}
			}
			else{
				outputResults()
			}
		}

		//Don't check parent elements
		e.stopPropagation();
	});

	$(".wideincludebutton, .thinincludebutton").click(function(){
		var includeRule = this.id.substring(8);
		if(enemies.fl.include[includeRule]){
			enemies.fl.include[includeRule] = 0;
			$(this).removeClass("included");
			$(this).addClass("notincluded");
		}
		else{
			enemies.fl.include[includeRule] = 1;
			$(this).removeClass("notincluded");
			$(this).addClass("included");
		}
		initEnemyList();
		updateEnemyUI()
		calculate();
	});

	$("#add_turn_challenger_reset").click(function(){
		resetTurn("Challenger");
	})
	$("#add_turn_enemy_reset").click(function(){
		resetTurn("Enemy");
	})

	$("#add_turn_challenger").click(function(){
		addTurn("Challenger");
	})
	$("#add_turn_enemy").click(function(){
		addTurn("Enemy");
	})

	//Copy Function Buttons
	$(".button_copy").click(function(){
		if(this.id == "copy_enemy"){
			copyEnemy();
		}else{
			copyChallenger();
		}
	})

	//Custom List Adjustment Buttons
	$(".adj_apply_button").click(function(){
		if (this.id == "apply_total_health_challenger"){
			adjustHp(false, true);
		}else if (this.id == "apply_movement_buff_challenger"){
			adjustBuff(false, true);
		}

		if (enemies.cl.list.length > 0){
			if (this.id == "apply_hero_merge"){
				adjustCustomListMerge();
			}else if (this.id == "apply_damage_taken"){
				adjustHp(true);
			}else if (this.id == "apply_total_health"){
				adjustHp(false);
			}else if (this.id == "apply_status_buff"){
				adjustBuff(true);
			}else if (this.id == "apply_movement_buff"){
				adjustBuff(false);
			}
			calculate();
		}
	})

	//Custom List Reset Buttons
	$(".adj_reset_button").click(function(){
		if (this.id == "reset_health_challenger"){
			resetHp(true);
		}else if (this.id == "reset_buff_challenger"){
			resetBuffs(true);
		}else if (this.id == "reset_health"){
			resetHp(false);
		}else if (this.id == "reset_buff"){
			resetBuffs(false);
		}
		calculate();
	})

	//Import/Export Buttons
	$(".button_importexport").click(function(){
		var target = "challenger";
		var type = "import";
		if(this.id.indexOf("enemies") != -1){
			target = "enemies";
		}
		if(this.id.indexOf("export") != -1){
			type = "export";
		}
		showImportDialog(target,type);
	})

	$(".menu_button").click(function() {
	  showOptions($('input[name=menu]:checked').val());
	});

	$("#import_exit").click(function(){
		hideImportDialog();
	})

	$("#enemies_mode").change(function(){
		switchEnemySelect($(this).val());
	})

	$("#reset_challenger").click(function(){
		resetHero(challenger);
	})

	$("#reset_enemies").click(function(){
		resetHero(enemies.fl);
	})

	$("#reset_cl_enemy").click(function(){
		if(enemies.cl.list[options.customEnemySelected]){
			resetHero(enemies.cl.list[options.customEnemySelected]);
		}
	})

	$(document).mousemove(function(e){
		if(showingTooltip){
			var tooltipHeight =    $("#frame_tooltip").height();
			if(e.pageY + (tooltipHeight/2) + 10 > $("body").height()){
				$("#frame_tooltip").css({
					"left": e.pageX + 20 + "px",
					"top": e.pageY - tooltipHeight - 10 + "px"
				});
			}
			else{
				$("#frame_tooltip").css({
					"left": e.pageX + 20 + "px",
					"top": e.pageY - (tooltipHeight/2) + "px"
				});
			}
		}
	});

	// $(window).unload(function(){
	// 	//store options
	// 	localStorage.setItem("options",JSON.stringify(options));
	// 	localStorage.setItem("challenger",JSON.stringify(challenger));
	// 	localStorage.setItem("enemies",JSON.stringify(enemies));
	// })


	//Show update notice if hasn't been show for this cookie
	doUpdateNotice();
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

//Data manipulating helper functions

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

function initSettings(){
	localStorage['option_menu'] = "options";
	localStorage['option_colorFilter'] = "all";
	localStorage['option_rangeFilter'] = "all";
	localStorage['option_typeFilter'] = "all";
	localStorage['option_viewFilter'] = "all";
	localStorage['option_sortOrder'] = "worst";
	localStorage['option_showOnlyMaxSkills'] = "true";
	localStorage['option_showOnlyDuelSkills'] = "true";
	localStorage['option_autoCalculate'] = "true";
}

function initHero(hero, alreadyHasSkills){
	if(hero.index != -1){
		hero.naturalSkills = data.heroBaseSkills[hero.index];

		hero.validWeaponSkills = getValidSkills(hero,"weapon");
		hero.validRefineSkills = getValidSkills(hero,"refine");
		hero.validAssistSkills = getValidSkills(hero,"assist");
		hero.validSpecialSkills = getValidSkills(hero,"special");
		hero.validASkills = getValidSkills(hero,"a");
		hero.validBSkills = getValidSkills(hero,"b");
		hero.validCSkills = getValidSkills(hero,"c");
		hero.validSSkills = getValidSkills(hero,"s");
		if(!alreadyHasSkills){
			setSkills(hero);
		}
		else{
			//validate that the skills it already has are okay
			if(!hero.rarity){
				hero.rarity = 5;
			}
			data.skillSlots.forEach(function(slot){
				//console.log(data.heroes[hero.index].name + " valid" + capitalize(slot) + "Skills");
				if(hero["valid" + capitalize(slot) + "Skills"].indexOf(hero[slot]) == -1){
					hero[slot] = -1;
				}
			});
		}
		hero.validRefineSkills = getValidRefineSkills(hero,"refine");
		setSkillOptions(hero);
		setStats(hero);
	}
}

function initEnemyList(){
	setFlEnemies();
	updateFlEnemies();
	setSkills(enemies.fl);
	setStats(enemies.fl);
}

function getValidSkills(hero,slot){
	//returns an array of indices on "skills" array for skills that hero can learn
	//If hero has no index, returns all skills in slot except unique
	//if not given slot, gives all
	var validSkills = [];

	//If slot is refine, get valid refine skills
	if (slot == "refine"){
		return getValidRefineSkills(hero);
	}
	//Otherwise, get other skills
	for(var i = 0; i < data.skills.length; i++){
		var inheritRules = data.skills[i].inheritrule.split(","); //Thanks Galeforce (melee,physical)
		if(!slot || data.skills[i].slot == slot){
			if(hero.index != undefined){
				var attackType = getAttackTypeFromWeapon(data.heroes[hero.index].weapontype);
				var inheritRuleMatches = 0;
				for(var ruleNum = 0; ruleNum < inheritRules.length; ruleNum++){
					//console.log("Trying " + slot + ": " + data.skills[i].name);
					//can only use if hero starts with it
					if(inheritRules[ruleNum] == "unique"){
						if(hero.naturalSkills){
							for(var j = 0; j < hero.naturalSkills.length; j++){
								if(hero.naturalSkills[j][0] == data.skills[i].skill_id){
									inheritRuleMatches++;
								}
							}
						}
					}
					//inherit if weapon is right attacking type
					else if(attackType == inheritRules[ruleNum]){
						inheritRuleMatches++;
					}
					//inherit if weapon is right
					else if(data.weaponTypes.indexOf(inheritRules[ruleNum])!=-1){
						if(data.heroes[hero.index].weapontype==inheritRules[ruleNum]){
							inheritRuleMatches++;
						}
					}
					//inherit if movetype is right
					else if(data.moveTypes.indexOf(inheritRules[ruleNum])!=-1){
						if(inheritRules[ruleNum] === "mounted"){
							if(data.heroes[hero.index].movetype == "cavalry" || data.heroes[hero.index].movetype == "flying"){
								inheritRuleMatches++;
							}
						}
						else{
							if(data.heroes[hero.index].movetype==inheritRules[ruleNum]){
								inheritRuleMatches++;
							}
						}
					}
					//inherit if not a certain weapon
					else if(data.weaponTypes.indexOf(inheritRules[ruleNum].replace("non",""))!=-1){
						if(data.heroes[hero.index].weapontype!=inheritRules[ruleNum].replace("non","")){
							inheritRuleMatches++;
						}
					}
					//inherit if not a certain movement type
					else if(data.moveTypes.indexOf(inheritRules[ruleNum].replace("non",""))!=-1){
						if(inheritRules[ruleNum] === "nonmounted"){
							if(data.heroes[hero.index].movetype != "cavalry" && data.heroes[hero.index].movetype != "flying"){
								inheritRuleMatches++;
							}
						}
						else{
							if(data.heroes[hero.index].movetype!=inheritRules[ruleNum].replace("non","")){
								inheritRuleMatches++;
							}
						}
					}
					//inherit if is a certain color
					else if(data.colors.indexOf(inheritRules[ruleNum])!=-1){
						if(data.heroes[hero.index].color == inheritRules[ruleNum]){
							inheritRuleMatches++;
						}
					}
					//inherit if not a certain color
					else if(data.colors.indexOf(inheritRules[ruleNum].replace("non",""))!=-1){
						if(data.heroes[hero.index].color!=inheritRules[ruleNum].replace("non","")){
							inheritRuleMatches++;
						}
					}
					//inherit if weapon type in ranged group
					else if(inheritRules[ruleNum]=="ranged"){
						if(data.rangedWeapons.indexOf(data.heroes[hero.index].weapontype) != -1){
							inheritRuleMatches++;
						}
					}
					//inherit if weapon type in melee group
					else if(inheritRules[ruleNum]=="melee"){
						if(data.meleeWeapons.indexOf(data.heroes[hero.index].weapontype) != -1){
							inheritRuleMatches++;
						}
					}
					//everyone can inherit!
					else if(inheritRules[ruleNum]==""){
						inheritRuleMatches++;
					}
					else{
						//shouldn't get here
						//console.log("Issue finding logic for inheritrule " + inheritRules[ruleNum]);
					}

					if(inheritRuleMatches == inheritRules.length){
						validSkills.push(i);
					}
				}
			}
			else{
				//It's the right slot, not given hero.index, so it's valid unless unique
				if(inheritRules[0] != "unique"){
					validSkills.push(i);
				}
			}
		}
	}

	return validSkills;
}

//Returns a list of valid refine options for hero
function getValidRefineSkills(hero){
	var validSkills = [];

	//Return nothing if hero index is undefined
	if (hero.weapon == undefined || hero.weapon == -1){
		return validSkills;
	}

	//For each refine option in data.refine
	for (var i = 0; i < data.refine.length; i++){
		//Get list of prereqs for each type of refinement
		var prereqList = data.refine[i].prereq.split(",");
		var isPrereq = false;
		var heroWeaponName = data.skills[hero.weapon].name;
		//For each prereq in prereqList, each if it matches hero weapon name EXACTLY
		for (var prereq = 0; prereq < prereqList.length; prereq++){
			if (heroWeaponName == prereqList[prereq]){
				if (data.refine[i].exclusive == "" || data.refine[i].exclusive.split(",").indexOf(data.heroes[hero.index].name) != -1){
					isPrereq = true;
				}
			}
		}
		//If refine option is valid, push the option's index into the list
		if(isPrereq == true){
			validSkills.push(i);
		}
	}

	return validSkills;
}

function getHeroSkills(heroIndex){
	//returns an array of arrays of skill-rarity pairs
	var skillset = [];
	for(var i = 0; i < data.heroSkills.length;i++){
		if(data.heroSkills[i].hero_id==data.heroes[heroIndex].hero_id){
			var skillPair = [data.heroSkills[i].skill_id,data.heroSkills[i].rarity];
			skillset.push(skillPair);
		}
	}
	return skillset;
}

function getMaxSkills(skillset,rarity){
	//Finds max skills based on rarity
	//Gets one with highest sp cost
	var maxSkillset = {"weapon":-1,"assist":-1,"special":-1,"a":-1,"b":-1,"c":-1};
	for(var i = 0; i < skillset.length;i++){
		var skillIndex = getSkillIndexFromId(skillset[i][0]);
		var skill = data.skills[skillIndex];
		//TODO: Check what this does for assist
		if((skill.slot != "s") && skillset[i][1] <= rarity + 1){
			if(maxSkillset[skill.slot]==-1){
				maxSkillset[skill.slot] = skillIndex;
			}
			else{
				if(data.skills[maxSkillset[skill.slot]].sp < skill.sp){
					maxSkillset[skill.slot] = skillIndex;
				}
			}
		}
	}
	return maxSkillset;
}

//Return cooldown changes of skill
function getCDChange(skill, slot){
	//If skill slot is empty, return 0
	if (skill == undefined){
		return 0;
	}

	var skillName = skill.name;

	//Weapon
	if (slot == "weapon"){
		//Cooldown decrease
		if (skillName.indexOf("Killing Edge") != -1 		|| skillName.indexOf("Killer Axe") != -1		|| skillName.indexOf("Killer Lance") != -1
			|| skillName.indexOf("Killer Bow") != -1		|| skillName.indexOf("Slaying Bow") != -1 		|| skillName.indexOf("Slaying Edge") != -1
			|| skillName.indexOf("Slaying Axe") != -1		|| skillName.indexOf("Slaying Lance") != -1		|| skillName.indexOf("Cursed Lance") != -1
			|| skillName.indexOf("Mystletainn") != -1		|| skillName.indexOf("Hauteclere") != -1		|| skillName.indexOf("Urvan") != -1
			|| skillName.indexOf("Audhulma") != -1			|| skillName.indexOf("Kagami Mochi") != -1		|| skillName.indexOf("Basilikos") != -1
			|| skillName.indexOf("Berserk Armads") != -1    || skillName.indexOf("Nameless Blade") != -1	|| skillName.indexOf("Barb Shuriken") != -1
			|| skillName.indexOf("Mjolnir") != -1			|| skillName.indexOf("Vassal's Blade") != -1	|| skillName.indexOf("Dauntless Lance") != -1
			|| skillName.indexOf("Maltet") != -1			|| skillName.indexOf("Hoarfrost Knife") != -1	|| skillName.indexOf("Missiletainn") != -1
			|| skillName.indexOf("Draconic Rage") != -1     || skillName.indexOf("Festive Siegmund") != -1　|| skillName.indexOf("Whitewing Lance") != -1
			|| skillName.indexOf("Scarlet Sword") != -1		|| skillName.indexOf("Golden Dagger") != -1		|| skillName.indexOf("Shanna's Lance") != -1
			){
				return -1;
        }
		//Cooldown increase
		if (skillName.indexOf("Raudrblade") != -1 			|| skillName.indexOf("Blarblade") != -1 	|| skillName.indexOf("Gronnblade") != -1
			|| skillName.indexOf("Lightning Breath") != -1
			){
				return 1;
		}
	}

	//Refine
	if	(slot == "refine"){
        //Refinement changes to cooldown go here
        if (skill.category == 'Cooldown Decrease Ranged') {
            return -1;
        }
	}

	//Assist
	if (slot == "assist"){
		//Cooldown increase
		if (skillName == "Martyr" || skillName == "Rehabilitate" || skillName == "Recover"){
				return 1;
		}
	}

	if (slot == "b"){
		//Cooldown increase
		if (skillName.indexOf("Lunar Brace") != -1){
			return 1;
		}
	}

	//Seal
	if (slot == "s"){

	}

	//No Change
	return 0;
}

function getPrechargeChange(skill, slot){
	//If skill slot is empty, return 0
	if (skill == undefined){
		return 0;
	}

	var skillName = skill.name;

	//Refine Skill
	if (slot == "refine"){
		if (skill.name == 'Quickened Pulse') {
			return 2;
		}
	}

	//Weapon Skill
	if (slot == "weapon"){
		if (skillName.indexOf("Missiletainn (Tome)") != -1){
			return 1;
		}
	}

	//B Skill
	if (slot == "b"){
		if(skillName.indexOf("S Drink") != -1){
			return 1;
		}
	}

	//Seal
	if (slot == "s"){
		if(skillName.indexOf("Quickened Pulse") != -1){
			return 1;
		}
	}

	//No Change
	return 0;
}

function isDragonEffective(hero){
	if (hero.hasExactly("Falchion") 		|| hero.hasExactly("Sealed Falchion")	|| hero.has("Exalted Falchion")
		|| hero.hasExactly("Naga")			|| hero.hasExactly("Divine Naga")		|| hero.has("Divine Mist")
		|| hero.hasExactly("Breath of Fog")	|| hero.hasExactly("Summer's Breath")
		|| hero.has("Cloud Maiougi")
		|| (hero.hasExactly("Binding Blade") && hero.refineIndex != -1)
		){
		return true;
	}
	return false;
}

//Return type of special skill
function getSpecialType(skill){

	//If skill slot is empty, return undefined
	if (skill == undefined){
		return "undefined";
	}

	var skillName = skill.name;

	//If special is defensive
	if (skillName.indexOf("Miracle") != -1 				|| skillName.indexOf("Aegis") != -1 			|| skillName.indexOf("Buckler") != -1
		|| skillName.indexOf("Escutcheon") != -1		|| skillName.indexOf("Holy Vestments") != -1 	|| skillName.indexOf("Pavise") != -1
		|| skillName.indexOf("Sacred Cowl")!= -1		|| skillName.indexOf("Ice Mirror")!= -1
		){
		return "defensive";
	//Else if special is supportive
	}else if (skillName.indexOf("Heavenly Light") != -1 || skillName.indexOf("Imbue") != -1				|| skillName.indexOf("Kindled-Fire Balm") != -1
		|| skillName.indexOf("Solid-Earth Balm") != -1	|| skillName.indexOf("Still-Water Balm") != -1	|| skillName.indexOf("Swift-Winds Balm") != -1
		|| skillName.indexOf("Windfire Balm") != -1	|| skillName.indexOf("Earthfire Balm") != -1	|| skillName.indexOf("Earthwater Balm") != -1
		){
		return "supportive";
	//Else if special is offensive
	}else{
		return "offensive";
	}
}

//Return true if hero can counter any range
function canCounterAnyRange(hero){
	if(hero.has("Close Counter")		|| hero.has("Distant Counter")	|| hero.has("Ostian Counter")
		|| hero.has("Lightning Breath")	|| hero.has("Raijinto")			|| hero.has("Siegfried")
		|| hero.has("Ragnell")			|| hero.has("Gradivus")			|| hero.has("Alondite")
		|| hero.has("Stout Tomahawk")	|| hero.has("Leiptr")			|| hero.has("Expiration")
		|| hero.has("Divine Mist")
		){
		return true;
	}
	return false;
}

function setStats(hero){
	if(hero.isFl){
		enemies.fl.avgHp = 0;
		enemies.fl.avgAtk = 0;
		enemies.fl.avgSpd = 0;
		enemies.fl.avgDef = 0;
		enemies.fl.avgRes = 0;

		var numIncluded = 0;

		for(var i = 0; i < enemies.fl.list.length;i++){
			if(enemies.fl.list[i].included){
				setStats(enemies.fl.list[i]);

				enemies.fl.avgHp += enemies.fl.list[i].hp;
				enemies.fl.avgAtk += enemies.fl.list[i].atk;
				enemies.fl.avgSpd += enemies.fl.list[i].spd;
				enemies.fl.avgDef += enemies.fl.list[i].def;
				enemies.fl.avgRes += enemies.fl.list[i].res;

				numIncluded++;
			}
		}
		if(numIncluded > 0){
			enemies.fl.avgHp = Math.round(enemies.fl.avgHp/numIncluded);
			enemies.fl.avgAtk = Math.round(enemies.fl.avgAtk/numIncluded);
			enemies.fl.avgSpd = Math.round(enemies.fl.avgSpd/numIncluded);
			enemies.fl.avgDef = Math.round(enemies.fl.avgDef/numIncluded);
			enemies.fl.avgRes = Math.round(enemies.fl.avgRes/numIncluded);
		}
	}
	else if(typeof hero.index != "undefined" && hero.index != -1){
		var growthValMod = {"hp":0,"atk":0,"spd":0,"def":0,"res":0};
		if(hero.boon != "none"){
			growthValMod[hero.boon] += 1;
		}
		if(hero.bane != "none"){
			growthValMod[hero.bane] -= 1;
		}

		var base = {};
		base.hp = data.heroes[hero.index].basehp + growthValMod.hp;
		base.atk = data.heroes[hero.index].baseatk + growthValMod.atk;
		base.spd = data.heroes[hero.index].basespd + growthValMod.spd;
		base.def = data.heroes[hero.index].basedef + growthValMod.def;
		base.res = data.heroes[hero.index].baseres + growthValMod.res;

		hero.hp = base.hp + data.growths[hero.rarity-1][data.heroes[hero.index].hpgrowth + growthValMod.hp];
		hero.atk = base.atk + data.growths[hero.rarity-1][data.heroes[hero.index].atkgrowth + growthValMod.atk];
		hero.spd = base.spd + data.growths[hero.rarity-1][data.heroes[hero.index].spdgrowth + growthValMod.spd];
		hero.def = base.def + data.growths[hero.rarity-1][data.heroes[hero.index].defgrowth + growthValMod.def];
		hero.res = base.res + data.growths[hero.rarity-1][data.heroes[hero.index].resgrowth + growthValMod.res];

		//Calculate hero BST after IV before merge stat bonuses
		hero.bst = hero.hp + hero.atk + hero.spd + hero.def + hero.res;

		//Add merge bonuses
		var mergeBoost = {"hp":0,"atk":0,"spd":0,"def":0,"res":0};

		//Order that merges happen is highest base stats, tiebreakers go hp->atk->spd->def->res
		var mergeOrder = ["hp","atk","spd","def","res"];
		var boostPriority = {"hp":4,"atk":3,"spd":2,"def":1,"res":0};
		mergeOrder.sort(function(a,b){
			if(base[a]>base[b]){
				return -1;
			}
			else if(base[a]<base[b]){
				return 1;
			}
			else{
				if(boostPriority[a]>boostPriority[b]){
					return -1;
				}
				else{
					return 1;
				}
			}
		});

		var mergeBoostCount = hero.merge*2;
		for(var i = 0; i < mergeBoostCount; i++){
			mergeBoost[mergeOrder[i%5]]++;
		}

		if(hero.rarity<5){
			//Modify base stats based on rarity
			//Order that base stats increase by rarity is similar to merge bonuses, except HP always happens at 3* and 5*
			//Rarity base boosts don't taken into account boons/banes, so modify bases again and sort again
			base.atk = base.atk - growthValMod.atk;
			base.spd = base.spd - growthValMod.spd;
			base.def = base.def - growthValMod.def;
			base.res = base.res - growthValMod.res;

			var rarityBaseOrder = ["atk","spd","def","res"];
			rarityBaseOrder.sort(function(a,b){
				if(base[a]>base[b]){
					return -1;
				}
				else if(base[a]<base[b]){
					return 1;
				}
				else{
					if(boostPriority[a]>boostPriority[b]){
						return -1;
					}
					else{
						return 1;
					}
				}
			});

			rarityBaseOrder.push("hp");
			var rarityBoostCount = Math.floor((hero.rarity-1) * 2.5);

			//Just going to dump these stat boosts in mergeBoost
			for(var i = 0; i < rarityBoostCount; i++){
				mergeBoost[rarityBaseOrder[i%5]]++;
			}

			//Subtract 2 from every stat since bases are pulled in at 5*
			mergeBoost.hp -= 2;
			mergeBoost.atk -= 2;
			mergeBoost.spd -= 2;
			mergeBoost.def -= 2;
			mergeBoost.res -= 2;
		}

		hero.hp += mergeBoost.hp;
		hero.atk += mergeBoost.atk;
		hero.spd += mergeBoost.spd;
		hero.def += mergeBoost.def;
		hero.res += mergeBoost.res;

		//Add hero hp changes
		hero.hp += hero.buffs.hp + hero.debuffs.hp;

		//Blessing bonuses are not(?) included in BST
		//hero.bst += hero.buffs.hp + hero.debuffs.hp;

		//Confer Blessing
		switch (hero.bless_1){
			case "atk":
				hero.hp += 3;
				hero.atk += 2;
				break;
			case "spd":
				hero.hp += 3;
				hero.spd += 3;
				break;
			case "def":
				hero.hp += 3;
				hero.def += 4;
				break;
			case "res":
				hero.hp += 3;
				hero.res += 4;
				break;
			default:
				break;
		}
		switch (hero.bless_2){
			case "atk":
				hero.hp += 3;
				hero.atk += 2;
				break;
			case "spd":
				hero.hp += 3;
				hero.spd += 3;
				break;
			case "def":
				hero.hp += 3;
				hero.def += 4;
				break;
			case "res":
				hero.hp += 3;
				hero.res += 4;
				break;
			default:
				break;
		}
		switch (hero.bless_3){
			case "atk":
				hero.hp += 3;
				hero.atk += 2;
				break;
			case "spd":
				hero.hp += 3;
				hero.spd += 3;
				break;
			case "def":
				hero.hp += 3;
				hero.def += 4;
				break;
			case "res":
				hero.hp += 3;
				hero.res += 4;
				break;
			default:
				break;
		}

		//Add stats based on skills
		if(hero.weapon != -1){
			hero.hp += data.skills[hero.weapon].hp;
			hero.atk += data.skills[hero.weapon].atk;
			hero.spd += data.skills[hero.weapon].spd;
			hero.def += data.skills[hero.weapon].def;
			hero.res += data.skills[hero.weapon].res;
		}
		if(hero.refine != -1){
			hero.hp += data.refine[hero.refine].hp;
			hero.atk += data.refine[hero.refine].atk;
			hero.spd += data.refine[hero.refine].spd;
			hero.def += data.refine[hero.refine].def;
			hero.res += data.refine[hero.refine].res;
		}
		if(hero.a != -1){
			hero.hp += data.skills[hero.a].hp;
			hero.atk += data.skills[hero.a].atk;
			hero.spd += data.skills[hero.a].spd;
			hero.def += data.skills[hero.a].def;
			hero.res += data.skills[hero.a].res;
		}
		if(hero.s != -1){
			hero.hp += data.skills[hero.s].hp;
			hero.atk += data.skills[hero.s].atk;
			hero.spd += data.skills[hero.s].spd;
			hero.def += data.skills[hero.s].def;
			hero.res += data.skills[hero.s].res;
		}

		//Summoner Support
		switch (hero.summoner){
			case "s":
				hero.hp += 5;
				hero.atk += 2;
				hero.spd += 2;
				hero.def += 2;
				hero.res += 2;
				break;
			case "a":
				hero.hp += 4;
				hero.spd += 2;
				hero.def += 2;
				hero.res += 2;
				break;
			case "b":
				hero.hp += 4;
				hero.def += 2;
				hero.res += 2;
				break;
			case "c":
				hero.hp += 3;
				hero.res += 2;
				break;
			default:
				break;
		}
	}
}

//Calculate damage from current HP
function updateHealth(value, hero){
	if (value > hero.hp || value <= 0){
		hero.damage = 0;
	}else{
		hero.damage = hero.hp - hero.currenthp;
	}
}

//Calculate possible adjacent unit combinations
function updateAdjacentValues(dataVar, hero){
	if (endsWith(dataVar, ".adjacent")){
		hero.adjacent2 = Math.max(hero.adjacent, hero.adjacent2);
		hero.adjacent2 = Math.min(hero.adjacent + 8, hero.adjacent2)
	}
	if (endsWith(dataVar, ".adjacent2")){
		hero.adjacent = Math.min(hero.adjacent, hero.adjacent2);
		hero.adjacent = Math.max(0, hero.adjacent, hero.adjacent2 - 8);
	}
	if (endsWith(dataVar, ".adjacent_foe")){
		hero.adjacent2_foe = Math.max(hero.adjacent_foe, hero.adjacent2_foe);
		hero.adjacent2_foe = Math.min(hero.adjacent_foe + 8, hero.adjacent2_foe)
	}
	if (endsWith(dataVar, ".adjacent2_foe")){
		hero.adjacent_foe = Math.min(hero.adjacent_foe, hero.adjacent2_foe);
		hero.adjacent_foe = Math.max(0, hero.adjacent_foe, hero.adjacent2_foe - 8);
	}
}

//Calculate total SP cost for hero
function updateSpt(hero){
	hero.spt = 0;
	hero.spt += (hero.weapon != -1 ? data.skills[hero.weapon].sp : 0);
	//TODO: Look into this and refine db to prevent negative sp from being added
	if (hero.refine != -1 && data.refine[hero.refine].sp > data.skills[hero.weapon].sp){
		hero.spt += data.refine[hero.refine].sp - data.skills[hero.weapon].sp
	}
	hero.spt += (hero.assist != -1 ? data.skills[hero.assist].sp : 0);
	hero.spt += (hero.special != -1 ? data.skills[hero.special].sp : 0);
	hero.spt += (hero.a != -1 ? data.skills[hero.a].sp : 0);
	hero.spt += (hero.b != -1 ? data.skills[hero.b].sp : 0);
	hero.spt += (hero.c != -1 ? data.skills[hero.c].sp : 0);
	hero.spt += (hero.s != -1 ? data.skills[hero.s].sp : 0);
}

//Adjust merge level for heroes in custom list
function adjustCustomListMerge(){
	enemies.cl.list.forEach(function(hero){
		hero.merge = enemies.cl.merges;
		//Update hero base stats
		setStats(hero);
	});

	//Update enemy UI
	updateEnemyUI();
}

//Adjust HP for heroes in custom list
function adjustHp(isFlat, isChallenger){
	if (isChallenger){
		if (!isFlat){
			challenger.damage = Math.ceil(challenger.hp * (1.00 - (challenger.HpPercent * 0.25)));
		}
		updateChallengerUI();
	}else{
		//Adjust the amount of damage each hero took
		enemies.cl.list.forEach(function(hero){
			if (isFlat){
				hero.damage = enemies.cl.damages;
			}else{
				//HP is floored, but this is rounded towards positive infinity since it is calculating damage
				hero.damage = Math.ceil(hero.hp * (1.00 - (enemies.cl.HpPercent * 0.25)));
			}
		});

		//Update enemy UI
		updateEnemyUI();
	}
}

//Reset HP for heroes in custom list
function resetHp(isChallenger){
	if (isChallenger){
		challenger.damage = 0;
		$("#challenger_HpPercent").val('4');
		challenger.HpPercent = 4;
		updateChallengerUI();
	}else{
		//Reset all custom list hero damage to 0
		if (enemies.cl.list.length > 0){
			enemies.cl.list.forEach(function(hero){
				hero.damage = 0;
			});
		}
		//Initialize custom list damage adjustment UI
		$("#enemies_cl_damage").val("0");
		enemies.cl.damages = 0;
		$("#enemies_cl_HpPercent").val('4');
		enemies.cl.HpPercent = 4;
		//Update enemy UI
		updateEnemyUI();
	}
}

//Adjust buffs for heroes in custom list
function adjustBuff(isStat, isChallenger){
	if (isChallenger){
		if (!isStat){
			var buffStats = [];
			var buffVal = (challenger.movement == "infantry") ? 4 : 6;
			var isSpur = false;

			//Set type of buff and adjusted stats
			switch (challenger.movementbuff){
				case "hone":
					isSpur = false;
					buffStats.push("atk");
					buffStats.push("spd");
					break;
				case "fortify":
					isSpur = false;
					buffStats.push("def");
					buffStats.push("res");
					break;
				case "goad":
					isSpur = true;
					buffStats.push("atk");
					buffStats.push("spd");
					buffVal = 4;
					break;
				case "goad x2":
					isSpur = true;
					buffStats.push("atk");
					buffStats.push("spd");
					buffVal = 8;
					break;
				case "ward":
					isSpur = true;
					buffStats.push("def");
					buffStats.push("res");
					buffVal = 4;
					break;
				case "ward x2":
					isSpur = true;
					buffStats.push("def");
					buffStats.push("res");
					buffVal = 8;
					break;
				default:
					console.log("Invalid Skill Buff input.")
			}

			//Add buffs for challenger based on buffStats, buffVal, and isSpur
			buffStats.forEach(function(stat){
				if (isSpur){
					challenger.spur[stat] = buffVal;
				}else{
					if (enemies.cl.movement == "all"){
						challenger.buffs[stat] = (data.heroes[challenger.index].movetype == "infantry" && data.heroes[challenger.index].weapontype != "dragon") ? 4 : 6;
					}else{
						challenger.buffs[stat] = buffVal;
					}
				}
			});
		}
		updateChallengerUI();
	}else{
		//For single stat adjustments
		if (isStat){
			//Adjust all stats except hp
			if (enemies.cl.status == "all"){
				enemies.cl.list.forEach(function(hero){
					data.stats.forEach(function(stat){
						if (stat != "hp"){
							(enemies.cl.statusbuff > 0) ? hero.buffs[stat] = enemies.cl.statusbuff : hero.debuffs[stat] = enemies.cl.statusbuff;
						}
					});
				});
			}
			//Adjust single stats
			else{
				enemies.cl.list.forEach(function(hero){
					if (enemies.cl.statusbuff > 0){
						hero.buffs[enemies.cl.status] = enemies.cl.statusbuff;
					}else{
						hero.debuffs[enemies.cl.status] = enemies.cl.statusbuff;
					}
					if (enemies.cl.status == "hp"){
						setStats(hero);
					}
				});
			}
		}
		//For multiple stat adjustments
		else{
			var buffStats = [];
			var buffVal = (enemies.cl.movement == "infantry") ? 4 : 6;
			var isSpur = false;

			//Set type of buff and adjusted stats
			switch (enemies.cl.movementbuff){
				case "hone":
					isSpur = false;
					buffStats.push("atk");
					buffStats.push("spd");
					break;
				case "fortify":
					isSpur = false;
					buffStats.push("def");
					buffStats.push("res");
					break;
				case "goad":
					isSpur = true;
					buffStats.push("atk");
					buffStats.push("spd");
					buffVal = 4;
					break;
				case "goad x2":
					isSpur = true;
					buffStats.push("atk");
					buffStats.push("spd");
					buffVal = 8;
					break;
				case "ward":
					isSpur = true;
					buffStats.push("def");
					buffStats.push("res");
					buffVal = 4;
					break;
				case "ward x2":
					isSpur = true;
					buffStats.push("def");
					buffStats.push("res");
					buffVal = 8;
					break;
				default:
					console.log("Invalid Skill Buff input.")
			}

			//Add buffs for each hero based on buffStats, buffVal, and isSpur
			enemies.cl.list.forEach(function(hero){
				if (enemies.cl.movement == "all" || data.heroes[hero.index].movetype == enemies.cl.movement || data.heroes[hero.index].weapontype == enemies.cl.movement){
					//console.log(data.heroes[hero.index].movetype + " " + enemies.cl.movement + " " + buffVal + " " + isSpur);
					buffStats.forEach(function(stat){
						if (isSpur){
							hero.spur[stat] = buffVal;
						}else{
							if (enemies.cl.movement == "all"){
								hero.buffs[stat] = (data.heroes[hero.index].movetype == "infantry" && data.heroes[hero.index].weapontype != "dragon") ? 4 : 6;
							}else{
								hero.buffs[stat] = buffVal;
							}
						}
					});
				}
			});
		}

		//Update enemy UI
		updateEnemyUI();
	}
}

//Reset buffs for heroes in custom list
function resetBuffs(isChallenger){
	if (isChallenger){
		if (challenger.buffs.hp != 0 || challenger.debuffs.hp != 0){
			challenger.buffs.hp = 0;
			challenger.debuffs.hp = 0;
			setStats(challenger);
		}
		challenger.buffs = {"hp":0,"atk":0,"spd":0,"def":0,"res":0};
		challenger.debuffs = {"hp":0,"atk":0,"spd":0,"def":0,"res":0};
		challenger.spur = {"hp":0,"atk":0,"spd":0,"def":0,"res":0};
		updateChallengerUI();
	}else{
		//Reset all custom list hero buffs and debuffs to 0
		enemies.cl.list.forEach(function(hero){
			if (hero.buffs.hp != 0 || hero.debuffs.hp != 0){
				hero.buffs.hp = 0;
				hero.debuffs.hp = 0;
				setStats(hero);
			}
			hero.buffs = {"hp":0,"atk":0,"spd":0,"def":0,"res":0};
			hero.debuffs = {"hp":0,"atk":0,"spd":0,"def":0,"res":0};
			hero.spur = {"hp":0,"atk":0,"spd":0,"def":0,"res":0};
		});

		//Update enemy UI
		updateEnemyUI();
	}
}

function setSkills(hero){
	if(hero.isFl){
		for(var i = 0; i < enemies.fl.list.length;i++){
			//Set default skills
			setSkills(enemies.fl.list[i]);
			//If current enemy does not have a weapon, skip and continue to the next enemy
			if (!data.skills[enemies.fl.list[i].weapon]){
				continue;
			}
			//Find if skill needs replacement based on inputs
			data.skillSlots.forEach(function(slot){
				//For refine slot: Check if enemy weapon matches selected weapon filter
				if (slot == "refine" && hero.refine != undefined && hero.refine != -1){
					if (data.skills[enemies.fl.list[i].weapon].name == data.skills[enemies.fl.weapon].name){
						enemies.fl.list[i].refine = enemies.fl.refine;
					}
				}else if(enemies.fl[slot] != -1 && (enemies.fl["replace" + capitalize(slot)] == 1 || enemies.fl.list[i][slot] == -1)){
					if(data.heroPossibleSkills[enemies.fl.list[i].index].indexOf(enemies.fl[slot]) != -1){
						enemies.fl.list[i][slot] = enemies.fl[slot];
					}
				}
			});
		}
	}
	else if(typeof hero.index != "undefined" && hero.index != -1){
		hero.weapon = data.heroMaxSkills[hero.rarity-1][hero.index].weapon;
		hero.refine = -1;
		hero.assist = data.heroMaxSkills[hero.rarity-1][hero.index].assist;
		hero.special = data.heroMaxSkills[hero.rarity-1][hero.index].special;
		hero.a = data.heroMaxSkills[hero.rarity-1][hero.index].a;
		hero.b = data.heroMaxSkills[hero.rarity-1][hero.index].b;
		hero.c = data.heroMaxSkills[hero.rarity-1][hero.index].c;
		hero.s = -1;
	}
}

//Copies stats from target onto the clone
function cloneHero(clone, target){
		clone.index = target.index;
		clone.rarity = target.rarity;
		clone.merge = target.merge;
		clone.boon = target.boon;
		clone.bane = target.bane;
		clone.summoner = target.summoner;
		clone.ally = target.ally;
		clone.bless_1 = target.bless_1;
		clone.bless_2 = target.bless_2;
		clone.bless_3 = target.bless_3;
		clone.weapon = target.weapon;
		clone.refine = target.refine;
		clone.assist = target.assist;
		clone.special = target.special;
		clone.a = target.a;
		clone.b = target.b;
		clone.c = target.c;
		clone.s = target.s;
		clone.buffs = jQuery.extend(true, {}, target.buffs);
		clone.debuffs = jQuery.extend(true, {}, target.debuffs);
		clone.spur = jQuery.extend(true, {}, target.spur);
		clone.damage = target.damage;
		clone.precharge = target.precharge;
		clone.adjacent = target.adjacent;
		clone.adjacent2 = target.adjacent2;
		clone.adjacent_foe = target.adjacent_foe;
		clone.adjacent2_foe = target.adjacent2_foe;
		//Clone stats (currently reset by initHero)
		clone.hp = target.hp;
		clone.atk = target.atk;
		clone.spd = target.spd;
		clone.def = target.def;
		clone.res = target.res;
}

function resetHero(hero,blockInit){//also resets fl, despite singular name - pass enemies.fl
	hero.rarity = 5;
	hero.merge = 0;
	hero.boon = "none";
	hero.bane = "none";
	hero.summoner = "none";
	hero.ally = "none";
	hero.bless_1 = "none";
	hero.bless_2 = "none";
	hero.bless_3 = "none";
	hero.adjacent = 1;
	hero.adjacent2 = 1;
	hero.adjacent_foe = 1;
	hero.adjacent2_foe = 1;

	hero.damage = 0;
	hero.precharge = 0;
	hero.buffs = {"hp":0,"atk":0,"spd":0,"def":0,"res":0};
	hero.debuffs = {"hp":0,"atk":0,"spd":0,"def":0,"res":0};
	hero.spur = {"hp":0,"atk":0,"spd":0,"def":0,"res":0};

	if(hero.index >= 0){
		setSkills(hero);
		setStats(hero);
	}

	if(hero.challenger){
		updateChallengerUI();
	}
	else{
		//If current enemy list is Full List
		if(options.customEnemyList == 0){
			hero.weapon = -1;
			hero.refine = -1;
			hero.assist = -1;
			hero.special = -1;
			hero.a = -1;
			hero.b = -1;
			hero.c = -1;
			hero.s = -1;
			hero.replaceWeapon = 0;
			hero.replaceRefine = 0;
			hero.replaceAssist = 0;
			hero.replaceSpecial = 0;
			hero.replaceA = 0;
			hero.replaceB = 0;
			hero.replaceC = 0;
			hero.replaceS = 0;
			hero.include = {"melee":1,"ranged":1,"red":1,"blue":1,"green":1,"gray":1,"physical":1,"magical":1,"infantry":1,"cavalry":1,"flying":1,"armored":1,"staff":0,"nonstaff":1};

			if(!blockInit){
				initEnemyList();
			}
		}
		updateEnemyUI();
	}
	calculate();
}

function addClEnemy(index){
	if(!index){
		index = -1;
	}

	var newCustomEnemyId = enemies.cl.list.length;

	enemies.cl.list.push({
		"index":index,"hp":0,"atk":0,"spd":0,"def":0,"res":0,"weapon":-1,"refine":-1,"assist":-1,"special":-1,"a":-1,"b":-1,"c":-1,"s":-1,
		"buffs": {"hp":0,"atk":0,"spd":0,"def":0,"res":0}, "debuffs": {"hp":0,"atk":0,"spd":0,"def":0,"res":0}, "spur": {"hp":0,"atk":0,"spd":0,"def":0,"res":0},
		"boon": "none", "bane":"none", "summoner":"none", "ally":"none", "bless_1":"none", "bless_2":"none", "bless_3":"none", "merge":0, "rarity":5, "precharge":0,
		"adjacent":1, "adjacent2":1, "adjacent_foe":1, "adjacent2_foe":1, "damage":0
	});
	options.customEnemySelected = newCustomEnemyId;
	updateEnemyUI();
	updateClList();

	//Scroll to end of list
	$('#cl_enemylist_list').scrollTop((options.customEnemySelected - 14) * 25 - 10);
}

function selectClEnemy(clEnemyId){
	//this gets called when deleteClEnemy is called because the delete button is inside the select button
	if(clEnemyId < enemies.cl.list.length){
		options.customEnemySelected = clEnemyId;
		updateClList();
		updateEnemyUI();
	}
}

function deleteSelectedClEnemy(){
	enemies.cl.list.splice(options.customEnemySelected, 1);
	if(options.customEnemySelected >= enemies.cl.list.length){
		options.customEnemySelected -= 1;
	}
	updateEnemyUI();
	updateClList();
	calculate();
}

function deleteClEnemy(event,clEnemyId){
	//Don't fuck with renaming ids, just move the text around and hide the highest id
	enemies.cl.list.splice(clEnemyId,1);
	if(options.customEnemySelected >= enemies.cl.list.length){
		options.customEnemySelected -= 1;
	}
	updateEnemyUI();
	updateClList();
	calculate();
	event.stopPropagation();
}

function removeAllClEnemies(){
	enemies.cl.list = [];
	options.customEnemySelected = -1;
	updateClList();
	updateEnemyUI();
	calculate();
}

function setFlEnemies(){
	//sets enemies based on includerules
	//also updates enemy count display
	//Must be run before setStats(enemies.fl) or setSkills(enemies.fl);
	var includeCount = 0;

	for(var i = 0; i < data.heroes.length;i++){
		if(enemies.fl.list.length-1 < i){
			enemies.fl.list.push({"index":i,"hp":0,"atk":0,"spd":0,"def":0,"res":0,"weapon":-1,"refine":-1,"assist":-1,"special":-1,"a":-1,"b":-1,"c":-1,"s":-1,
				"buffs": enemies.fl.buffs, "debuffs": enemies.fl.debuffs, "spur": enemies.fl.spur,
				"boon": enemies.fl.boon, "bane": enemies.fl.bane, "summoner": enemies.fl.summoner, "ally": enemies.fl.ally, "bless_1": enemies.fl.bless_1, "bless_2": enemies.fl.bless_2, "bless_3": enemies.fl.bless_3,
				"merge": enemies.fl.merge, "rarity": enemies.fl.rarity, "precharge": enemies.fl.precharge,
				"adjacent": enemies.fl.adjacent, "adjacent2": enemies.fl.adjacent2, "adjacent_foe": enemies.fl.adjacent_foe, "adjacent2_foe": enemies.fl.adjacent2_foe, "damage": enemies.fl.damage
			});
		}

		var confirmed = true;
		//check generic heroes
		if(data.heroes[i].hero_id >= 9999){
			confirmed = false;
		}
		//check color
		if(!enemies.fl.include[data.heroes[i].color]){
			confirmed = false;
		}
		//check move type
		else if(!enemies.fl.include[data.heroes[i].movetype]){
			confirmed = false;
		}
		//check weapon range
		else if(!enemies.fl.include["melee"] && data.meleeWeapons.indexOf(data.heroes[i].weapontype)>=0){
			confirmed = false;
		}
		else if(!enemies.fl.include["ranged"] && data.rangedWeapons.indexOf(data.heroes[i].weapontype)>=0){
			confirmed = false;
		}
		//check weapon attack type
		else if(!enemies.fl.include["physical"] && data.physicalWeapons.indexOf(data.heroes[i].weapontype)>=0){
			confirmed = false;
		}
		else if(!enemies.fl.include["magical"] && data.magicalWeapons.indexOf(data.heroes[i].weapontype)>=0){
			confirmed = false;
		}
		else if(!enemies.fl.include["staff"] && data.heroes[i].weapontype == "staff"){
			confirmed = false;
		}
		else if(!enemies.fl.include["nonstaff"] && data.heroes[i].weapontype != "staff"){
			confirmed = false;
		}
		if(confirmed){
			enemies.fl.list[i].included = true;
			includeCount++;
		}
		else{
			enemies.fl.list[i].included = false;
		}
	}
	$("#enemies_count").html(includeCount);
}

function updateFlEnemies(){
	//Updates stuff that's not stats or skills
	for(var i = 0; i < enemies.fl.list.length; i++){
		enemies.fl.list[i].buffs =  enemies.fl.buffs;
		enemies.fl.list[i].debuffs =  enemies.fl.debuffs;
		enemies.fl.list[i].spur =  enemies.fl.spur;
		enemies.fl.list[i].boon =  enemies.fl.boon;
		enemies.fl.list[i].bane =  enemies.fl.bane;
		enemies.fl.list[i].summoner =  enemies.fl.summoner;
		enemies.fl.list[i].ally =  enemies.fl.ally;
		enemies.fl.list[i].bless_1 =  enemies.fl.bless_1;
		enemies.fl.list[i].bless_2 =  enemies.fl.bless_2;
		enemies.fl.list[i].bless_3 =  enemies.fl.bless_3;
		enemies.fl.list[i].merge =  enemies.fl.merge;
		enemies.fl.list[i].rarity =  enemies.fl.rarity;
		enemies.fl.list[i].precharge =  enemies.fl.precharge;
		enemies.fl.list[i].adjacent =  enemies.fl.adjacent;
		enemies.fl.list[i].adjacent2 =  enemies.fl.adjacent2;
		enemies.fl.list[i].adjacent_foe =  enemies.fl.adjacent_foe;
		enemies.fl.list[i].adjacent2_foe =  enemies.fl.adjacent2_foe;
		enemies.fl.list[i].damage =  enemies.fl.damage;
	}
	setSkills(enemies.fl);
	setStats(enemies.fl);
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

//UI Functions (mostly)

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

//TODO: Clean all these mid UI functions up
function showOptions(option){
	if (option == "options"){
		$("#frame_settings").show();
	}
	else{
		$("#frame_settings").hide();
	}

	if (option == "adjustments"){
		$("#frame_adjustments").show();
	}
	else{
		$("#frame_adjustments").hide();
	}

	if (option == "statistics"){
		$("#frame_statistics").show();
	}
	else{
		$("#frame_statistics").hide();
	}

	if (option == "close"){
		setWideUI(false);
	}
	else{
		setWideUI(true);
	}

	localStorage["option_menu"] = option;
}

function setWideUI(setWide){
	//If another mid UI is open, do not change width
	if (!setWide){
		if (!$("#frame_statistics").is(':hidden') || !$("#frame_adjustments").is(':hidden') || !$("#frame_settings").is(':hidden')){
			return;
		}
	}

	var originBarWidth = $("#results_graph_back").width();
	if (setWide){
		$("#frame_main").width(1125);
	}
	else{
		$("#frame_main").width(910);
	}
	$("#results_graph_back").width($("#frame_main").width() - 4);
	$("#results_graph_wins").width($("#results_graph_wins").width() * $("#results_graph_back").width() / originBarWidth);
	$("#results_graph_losses").width($("#results_graph_losses").width() * $("#results_graph_back").width() / originBarWidth);
}

//Reset filter select options
function resetFilter(){
	//Set filter UI
	options.colorFilter = "all";
	localStorage['option_colorFilter'] = "all";
	$('#color_results').val(options.colorFilter).trigger('change.select2');
	options.rangeFilter = "all";
	localStorage['option_rangeFilter'] = "all";
	$('#range_results').val(options.rangeFilter).trigger('change.select2');
	options.typeFilter = "all";
	localStorage['option_typeFilter'] = "all";
	$('#type_results').val(options.typeFilter).trigger('change.select2');
	options.viewFilter = "all";
	localStorage['option_viewFilter'] = "all";
	$('#view_results').val(options.viewFilter).trigger('change.select2');
	options.sortOrder = "worst";
	localStorage['option_sortOrder'] = "worst";
	$('#sort_results').val(options.sortOrder).trigger('change.select2');
	calculate();
}

//Select2 match function for matching starting characters
function matchStartHeroes(params, data) {
	//If there are no search terms, return all of the data
    if ($.trim(params.term) === '') {
		return data;
    }

    //Do not display the item if there is no 'text' property
    if (typeof data.text === 'undefined') {
		return null;
    }

	//If search term appears in the beginning of data's text
	if (data.text.toUpperCase().indexOf(params.term.toUpperCase()) == 0) {
		return data;
	}

	if (data.id != -1){
		//BST Search: If search term is a number, match with BST that are greater than the input
		if (isNaN(params.term) == false){
			if (this.data.heroes[data.id].basehp + this.data.growths[4][this.data.heroes[data.id].hpgrowth]
				+ this.data.heroes[data.id].baseatk + this.data.growths[4][this.data.heroes[data.id].atkgrowth]
				+ this.data.heroes[data.id].basespd + this.data.growths[4][this.data.heroes[data.id].spdgrowth]
				+ this.data.heroes[data.id].basedef + this.data.growths[4][this.data.heroes[data.id].defgrowth]
				+ this.data.heroes[data.id].baseres + this.data.growths[4][this.data.heroes[data.id].resgrowth]
				>= parseInt(params.term)){
				return data;
			}
		}

		//Move type search
		if (this.data.moveTypes.indexOf(params.term.toLowerCase()) != -1){
			if (this.data.heroes[data.id].movetype === params.term.toLowerCase()){
				return data;
			}
		}

		//Color search
		if (this.data.colors.indexOf(params.term.toLowerCase()) != -1){
			if (this.data.heroes[data.id].color === params.term.toLowerCase()){
				return data;
			}
		}
	}


    //Return `null` if the term should not be displayed
    return null;
}

//Select2 match function for matching starting characters
function matchStartHeroesList(params, data) {
	//If there are no search terms, return all of the data
    if ($.trim(params.term) === '') {
		return data;
    }

    //Do not display the item if there is no 'text' property
    if (typeof data.text === 'undefined') {
		return null;
    }

	//If search term appears in the beginning of data's text
	if (data.text.toUpperCase().indexOf(params.term.toUpperCase()) == 0) {
		return data;
	}

	if (enemies.cl.list[data.id] != -1){
		//If search term is a number, match with BST that are greater than the input
		//TODO:Add IVs into bst search param
		if (isNaN(params.term) == false){
			if (this.data.heroes[enemies.cl.list[data.id].index].basehp + this.data.growths[4][this.data.heroes[enemies.cl.list[data.id].index].hpgrowth]
				+ this.data.heroes[enemies.cl.list[data.id].index].baseatk + this.data.growths[4][this.data.heroes[enemies.cl.list[data.id].index].atkgrowth]
				+ this.data.heroes[enemies.cl.list[data.id].index].basespd + this.data.growths[4][this.data.heroes[enemies.cl.list[data.id].index].spdgrowth]
				+ this.data.heroes[enemies.cl.list[data.id].index].basedef + this.data.growths[4][this.data.heroes[enemies.cl.list[data.id].index].defgrowth]
				+ this.data.heroes[enemies.cl.list[data.id].index].baseres + this.data.growths[4][this.data.heroes[enemies.cl.list[data.id].index].resgrowth]
				>= parseInt(params.term)){
				return data;
			}
		}

		//Move type search
		if (this.data.moveTypes.indexOf(params.term.toLowerCase()) != -1){
			if (this.data.heroes[enemies.cl.list[data.id].index].movetype === params.term.toLowerCase()){
				return data;
			}
		}

		//Color search
		if (this.data.colors.indexOf(params.term.toLowerCase()) != -1){
			if (this.data.heroes[enemies.cl.list[data.id].index].color === params.term.toLowerCase()){
				return data;
			}
		}
	}



    //Return `null` if the term should not be displayed
    return null;
}

//Select2 match function for matching starting characters - Uses data.skills
function matchStartSkills(params, data) {
	//If there are no search terms, return all of the data
    if ($.trim(params.term) === '') {
		return data;
    }

    //Do not display the item if there is no 'text' property
    if (typeof data.text === 'undefined') {
		return null;
    }

	//If search term appears in the data's text
	if (data.text.toUpperCase().indexOf(params.term.toUpperCase()) > -1){
		return data;
	}

	//If search term is a number, match with sp cost that are greater than the input
	if (isNaN(params.term) == false && data.id != -1){
		if (this.data.skills[data.id].sp >= parseInt(params.term)){
			return data;
		}
	}

    //Return `null` if the term should not be displayed
    return null;
}

//Select2 match function for matching starting characters - Uses data.refine
function matchStartRefine(params, data) {
	//If there are no search terms, return all of the data
    if ($.trim(params.term) === '') {
		return data;
    }

    //Do not display the item if there is no 'text' property
    if (typeof data.text === 'undefined') {
		return null;
    }

	//If search term appears in the beginning of data's text
	if (data.text.toUpperCase().indexOf(params.term.toUpperCase()) > -1) {
		return data;
	}

	//If search term is a number, match with sp cost that are greater than the input
	if (isNaN(params.term) == false && data.id != -1){
		if (this.data.refine[data.id].sp >= parseInt(params.term)){
			return data;
		}
	}

    //Return `null` if the term should not be displayed
    return null;
}

function changeSkillPic(hero, slot){
	var htmlPrefix = getHtmlPrefix(hero);
	if(data.skills[hero[slot]]){
		var skillname = data.skills[hero[slot]].name;
		skillname = skillname.replace(/\s/g,"_");
		$("#" + htmlPrefix + slot + "_picture").attr("src","skills/" + skillname + ".png");
	}
	else{
		$("#" + htmlPrefix + slot + "_picture").attr("src","skills/noskill.png");
	}
}

function changeRefinePic(hero, slot){
	var htmlPrefix = getHtmlPrefix(hero);
	if(data.refine[hero[slot]]){
		var refineName = data.refine[hero[slot]].name;
		refineName = refineName.replace(/\s/g,"_");
		$("#" + htmlPrefix + slot + "_picture").attr("src","weapons/" + refineName + ".png");
	}
	else{
		$("#" + htmlPrefix + slot + "_picture").attr("src","skills/noskill.png");
	}
}

function setSkillOptions(hero){
	//set html for character skill select based on valid skills

	var htmlPrefix = "challenger_";
	var maxSkills = {"weapon":-1,"refine":-1,"assist":-1,"special":-1,"a":-1,"b":-1,"c":-1,"s":-1};
	if(typeof hero.index != "undefined" && hero.index != -1){
		maxSkills = data.heroMaxSkills[hero.rarity-1][hero.index];
	}

	if(!hero.challenger){
		if(hero.isFl){
			htmlPrefix = "enemies_";
		}
		else{
			htmlPrefix = "cl_enemy_";
		}
	}

	data.skillSlots.forEach(function(slot){
		var slotFriendlyText = slot;
		if(slot.length==1){
			//rename passives for display
			slotFriendlyText = slot.toUpperCase() + " passive";
		}
		var slotHTML = "<option value=-1>No " + slotFriendlyText + "</option>";
		var validSkills = hero["valid" + capitalize(slot) + "Skills"];
		if(validSkills){
			if(slot == "refine"){
				updateRefineUI(hero, htmlPrefix);
			}else{
				for(var i = 0; i < validSkills.length; i++){
					//Show the following skills for hero:
					//	Option: Non-max skills || Skills that are not prereqs
					//	Option: Non-duel skills || Skills that affect duels || Assist skills || Special skills
					//	Skill can be learned on hero (?)
					//	Skill is learned on hero
					if(((!options.showOnlyMaxSkills || data.skillsThatArePrereq.indexOf(data.skills[validSkills[i]].skill_id)==-1)
							&& (!options.hideUnaffectingSkills || data.skills[validSkills[i]].affectsduel || data.skills[validSkills[i]].slot == "assist" || data.skills[validSkills[i]].slot == "special"))
						|| validSkills[i] == maxSkills[slot]
						|| validSkills[i] == hero[slot]){
						slotHTML += "<option value=" + validSkills[i] + ">" + data.skills[validSkills[i]].name + "</option>";
					}
				}
			}
		}
		//TODO: Clean this up so slot does not have to be checked again
		if (slot != "refine"){
			$("#" + htmlPrefix + slot).html(slotHTML);
		}
	});
}

function updateRefineUI(hero){
	var htmlPrefix = "challenger_";
	var slotHTML = "<option value=-1>No refinement</option>";
	var validSkills = hero["valid" + capitalize("refine") + "Skills"];

	//Set htmlPrefix
	if(!hero.challenger){
		if(hero.isFl){
			htmlPrefix = "enemies_";
		}
		else{
			htmlPrefix = "cl_enemy_";
		}
	}

	//If hero exists, find their refine options
	if ((hero.index != undefined && hero.index != -1 )|| hero.isFl){
		validSkills = getValidRefineSkills(hero);
	}

	//Add each valid refine option into html string
	for(var i = 0; i < validSkills.length; i++){
		slotHTML += "<option value=" + validSkills[i] + ">" + data.refine[validSkills[i]].name + "</option>";
	}

	//Set html for specified hero type
	$("#" + htmlPrefix + "refine").html(slotHTML);
}

function updateEnemyList(){
	var listHTML = "";

	//Add each valid hero into html string
	if (enemies.cl.list.length == 0){
		listHTML = "<option value=-1 class=\"hero_option\">New List</option>";
	}else{
		for(var i = 0; i < enemies.cl.list.length; i++){
			if (enemies.cl.list[i].index < 0){
					listHTML += "<option value=" + i + ">" + "New Hero" + "</option>";
			}else{
				listHTML += "<option value=" + i + ">" + data.heroes[enemies.cl.list[i].index].name + "</option>";
			}
		}
	}

	$("#cl_enemy_list").html(listHTML).val(options.customEnemySelected).trigger('change.select2');
}

function updateFullUI(){
	//Refreshes everything about the UI - try to use more specific functions if possible
	updateChallengerUI();
	updateEnemyUI();
}

function updateChallengerUI(){
	updateHeroUI(challenger);
}

function updateEnemyUI(){
	$("#enemies_mode").val(options.customEnemyList);
	switchEnemySelect(options.customEnemyList);

	if(options.customEnemyList == 1){
		updateHeroUI(enemies.cl.list[options.customEnemySelected]);
		updateClList();
	}
	else{
		updateHeroUI(enemies.fl);
	}
	$("#cl_enemy_name").trigger('change.select2');
}

function updateHeroUI(hero){
	//Shared elements between challenger and custom enemy
	if(!hero){
		//Make a dummy hero
		hero = {
			"index":-1,"hp":0,"atk":0,"spd":0,"def":0,"res":0,"weapon":-1,"refine":-1,"assist":-1,"special":-1,"a":-1,"b":-1,"c":-1,"s":-1,
			"buffs": {"hp":0,"atk":0,"spd":0,"def":0,"res":0}, "debuffs": {"hp":0,"atk":0,"spd":0,"def":0,"res":0}, "spur": {"hp":0,"atk":0,"spd":0,"def":0,"res":0},
			"boon": "none", "bane":"none", "summoner":"none", "ally":"none", "bless_1":"none", "bless_2":"none", "bless_3":"none", "merge":0, "rarity":5, "precharge":0,
			"adjacent":1, "adjacent2":1, "adjacent_foe":1, "adjacent2_foe":1, "damage":0
		}
	}
	var htmlPrefix = getHtmlPrefix(hero);
	updateSpt(hero);

	//Global stuff
	//$("#" + htmlPrefix + "damage").val(hero.damage);
	$("#" + htmlPrefix + "precharge").val(hero.precharge);
	$("#" + htmlPrefix + "adjacent").val(hero.adjacent);
	$("#" + htmlPrefix + "adjacent2").val(hero.adjacent2);
	$("#" + htmlPrefix + "adjacent_foe").val(hero.adjacent_foe);
	$("#" + htmlPrefix + "adjacent2_foe").val(hero.adjacent2_foe);
	$("#" + htmlPrefix + "merge").val(hero.merge);
	$("#" + htmlPrefix + "rarity").val(hero.rarity);

	setSkillOptions(hero);
	$("#" + htmlPrefix + "weapon").val(hero.weapon);
	$("#" + htmlPrefix + "refine").val(hero.refine);
	$("#" + htmlPrefix + "assist").val(hero.assist);
	$("#" + htmlPrefix + "special").val(hero.special);
	$("#" + htmlPrefix + "a").val(hero.a);
	$("#" + htmlPrefix + "b").val(hero.b);
	$("#" + htmlPrefix + "c").val(hero.c);
	$("#" + htmlPrefix + "s").val(hero.s);
	changeRefinePic(hero,"refine");
	changeSkillPic(hero,"a");
	changeSkillPic(hero,"b");
	changeSkillPic(hero,"c");
	changeSkillPic(hero,"s");

	if(hero.buffs){
		$("#" + htmlPrefix + "hp_buff").val(hero.buffs.hp);
		$("#" + htmlPrefix + "atk_buff").val(hero.buffs.atk);
		$("#" + htmlPrefix + "spd_buff").val(hero.buffs.spd);
		$("#" + htmlPrefix + "def_buff").val(hero.buffs.def);
		$("#" + htmlPrefix + "res_buff").val(hero.buffs.res);
		$("#" + htmlPrefix + "hp_debuff").val(hero.debuffs.hp);
		$("#" + htmlPrefix + "atk_debuff").val(hero.debuffs.atk);
		$("#" + htmlPrefix + "spd_debuff").val(hero.debuffs.spd);
		$("#" + htmlPrefix + "def_debuff").val(hero.debuffs.def);
		$("#" + htmlPrefix + "res_debuff").val(hero.debuffs.res);
		$("#" + htmlPrefix + "atk_spur").val(hero.spur.atk);
		$("#" + htmlPrefix + "spd_spur").val(hero.spur.spd);
		$("#" + htmlPrefix + "def_spur").val(hero.spur.def);
		$("#" + htmlPrefix + "res_spur").val(hero.spur.res);
	}

	$("#" + htmlPrefix + "boon").val(hero.boon);
	$("#" + htmlPrefix + "bane").val(hero.bane);
	$("#" + htmlPrefix + "summoner").val(hero.summoner);
	$("#" + htmlPrefix + "ally").val(hero.ally);
	$("#" + htmlPrefix + "bless_1").val(hero.bless_1);
	$("#" + htmlPrefix + "bless_2").val(hero.bless_2);
	$("#" + htmlPrefix + "bless_3").val(hero.bless_3);

	if(typeof hero.index != "undefined" && hero.index != -1){ //cl/challenger-specific stuff
		$("#" + htmlPrefix + "name").val(hero.index);
		$("#" + htmlPrefix + "hp").val(hero.hp);
		$("#" + htmlPrefix + "currenthp").val(hero.hp - hero.damage);
		$("#" + htmlPrefix + "basehp").html(hero.hp);
		$("#" + htmlPrefix + "adjacent").val(hero.adjacent);
		$("#" + htmlPrefix + "adjacent2").val(hero.adjacent2);
		$("#" + htmlPrefix + "adjacent_foe").val(hero.adjacent_foe);
		$("#" + htmlPrefix + "adjacent2_foe").val(hero.adjacent2_foe);
		$("#" + htmlPrefix + "atk").val(hero.atk);
		$("#" + htmlPrefix + "spd").val(hero.spd);
		$("#" + htmlPrefix + "def").val(hero.def);
		$("#" + htmlPrefix + "res").val(hero.res);
		$("#" + htmlPrefix + "bst").html(hero.bst + " / " + hero.spt);
		$("#" + htmlPrefix + "asc").html(Math.round(100*(588.5 + 4*((hero.bst / 8) + (hero.spt / 240) + hero.merge + 5*(hero.rarity - 5)))) * 0.01);

		//Hero portrait
		if (data.heroes[hero.index].name.indexOf("Generic") != -1){
			if(data.heroes[hero.index].weapontype == "dragon" || data.heroes[hero.index].weapontype == "bow" ){
				$("#" + htmlPrefix + "picture").attr("src","heroes/generic/" + data.heroes[hero.index].movetype + "_" + data.heroes[hero.index].color + data.heroes[hero.index].weapontype + ".png");
			}else{
				$("#" + htmlPrefix + "picture").attr("src","heroes/generic/" + data.heroes[hero.index].movetype + "_" + data.heroes[hero.index].weapontype + ".png");
			}
		}else{
			$("#" + htmlPrefix + "picture").attr("src","heroes/" + data.heroes[hero.index].name + ".png");
		}

		//Weapon and movement icons
		if(data.heroes[hero.index].weapontype == "dragon" || data.heroes[hero.index].weapontype == "bow" || data.heroes[hero.index].weapontype == "dagger"){
			$("#" + htmlPrefix + "weapon_icon").attr("src","weapons/" + data.heroes[hero.index].color + data.heroes[hero.index].weapontype + ".png");
		}
		else{
			$("#" + htmlPrefix + "weapon_icon").attr("src","weapons/" + data.heroes[hero.index].weapontype + ".png");
		}
		$("#" + htmlPrefix + "movement_icon").attr("src","weapons/" + data.heroes[hero.index].movetype + ".png");

		//Update Charge UI
		if(hero.special != -1){
			var specialCharge = data.skills[hero.special].charge;
			var specialName = data.skills[hero.special].name;
			var precharge = 0;

			//Weapon Skill
			if(hero.weapon != -1){
				specialCharge += getCDChange(data.skills[hero.weapon], "weapon");
			}
			//Refine bonus
			if(hero.refine != -1){
				specialCharge += getCDChange(data.refine[hero.refine], "refine");
			}
			//Assist Skill
			if(hero.assist != -1){
				specialCharge += getCDChange(data.skills[hero.assist], "assist");
			}
			//B Skill
			if(hero.b != -1){
				specialCharge += getCDChange(data.skills[hero.b], "b");
			}

			//Precharge
			//TODO: Combine this from hero intialization
			//Refine
			if(hero.refine != -1){
				precharge += getPrechargeChange(data.refine[hero.refine], "refine");
			}
			//Weapon
			if (hero.weapon != -1){
				precharge += getPrechargeChange(data.skills[hero.weapon], "weapon");
			}
			//B Skill
			if(hero.b != -1){
				var bName = data.skills[hero.b].name;
				//Shield Pulse
				if (getSpecialType(data.skills[hero.special]) == "defensive"){
					if(bName.indexOf("Shield Pulse 3") != -1){
						precharge += 2;
					} else if(bName.indexOf("Shield Pulse 1") != -1 || bName.indexOf("Shield Pulse 2") != -1){
						precharge += 1;
					}
				}
				precharge += getPrechargeChange(data.skills[hero.b], "b");
			}
			//Special Item
			if(hero.s != -1){
				precharge += getPrechargeChange(data.skills[hero.s], "s");
			}
			//Buffs
			if (hero.challenger && options.pulse_challenger){
				precharge++;
			}
			if (!hero.challenger && options.pulse_enemy){
				precharge++;
			}

			//Display before precharge calculation to ignore precharge changes on UI (Old UI includes precharge changes for displayed value)
			$("#" + htmlPrefix + "specialcharge").html(precharge == 0 ? specialCharge : Math.max(0, specialCharge - precharge) + "(" + specialCharge + ")");

			specialCharge -= precharge;
			specialCharge -= hero.precharge;
			specialCharge = Math.max(0, specialCharge);
		}
		else{
			$("#" + htmlPrefix + "specialcharge").html("-");
		}
	}
	else{
		if(hero.isFl){
			//Do fl-specific stuff here (no heroIndex)
			$("#" + htmlPrefix + "weapon_overwrite").val(hero.replaceWeapon);
			$("#" + htmlPrefix + "refine_overwrite").val(hero.replaceRefine);
			$("#" + htmlPrefix + "assist_overwrite").val(hero.replaceAssist);
			$("#" + htmlPrefix + "special_overwrite").val(hero.replaceSpecial);
			$("#" + htmlPrefix + "a_overwrite").val(hero.replaceA);
			$("#" + htmlPrefix + "b_overwrite").val(hero.replaceB);
			$("#" + htmlPrefix + "c_overwrite").val(hero.replaceC);

			if(enemies.fl.list.length > 0){
				$("#" + htmlPrefix + "hp").html(enemies.fl.avgHp);
				$("#" + htmlPrefix + "atk").html(enemies.fl.avgAtk);
				$("#" + htmlPrefix + "spd").html(enemies.fl.avgSpd);
				$("#" + htmlPrefix + "def").html(enemies.fl.avgDef);
				$("#" + htmlPrefix + "res").html(enemies.fl.avgRes);
			}
			else{
				$("#" + htmlPrefix + "hp").html("-");
				$("#" + htmlPrefix + "atk").html("-");
				$("#" + htmlPrefix + "spd").html("-");
				$("#" + htmlPrefix + "def").html("-");
				$("#" + htmlPrefix + "res").html("-");
			}

			for(var attribute in hero.include){
				if(hero.include[attribute]){
					$("#include_" + attribute).removeClass("notincluded").addClass("included");
				}
				else{
					$("#include_" + attribute).removeClass("included").addClass("notincluded");
				}
			}
		}
		else{
			//Custom enemy unselected
			$("#" + htmlPrefix + "name").val(hero.index);
			$("#" + htmlPrefix + "picture").attr("src","heroes/nohero.png");
			$("#" + htmlPrefix + "hp").html("-");
			$("#" + htmlPrefix + "currenthp").html("-");
			$("#" + htmlPrefix + "atk").html("-");
			$("#" + htmlPrefix + "spd").html("-");
			$("#" + htmlPrefix + "def").html("-");
			$("#" + htmlPrefix + "res").html("-");
			$("#" + htmlPrefix + "weapon_icon").attr("src","weapons/noweapon.png");
			$("#" + htmlPrefix + "movement_icon").attr("src","weapons/noweapon.png");
			$("#" + htmlPrefix + "specialcharge").html("-");
		}
	}
}

function showResultsTooltip(e,resultDiv){
	var resultId = resultDiv.id.substring(7);
	showingTooltip = true;
	$("#frame_tooltip").html(fightResults[resultId].fightText).show();
}

function showHeroTooltip(heroType){
	var hero;
	var tooltipText;

	//Set hero to selected hero type
	switch (heroType){
		case "challenger":
			hero = challenger;
			break;
		case "list":
			hero = enemies.fl;
			break;
		case "custom":
			(options.customEnemySelected == -1) ? hero = -1 : hero = enemies.cl.list[options.customEnemySelected];
			break;
	}

	//If hero is undefined or empty, do nothing
	if (hero == -1 || hero.index == -1){
		return;
	}

	//Show tooltip
	showingTooltip = true;
	var base = {};
	base.hp = data.heroes[hero.index].basehp;
	base.atk = data.heroes[hero.index].baseatk;
	base.spd = data.heroes[hero.index].basespd;
	base.def = data.heroes[hero.index].basedef;
	base.res = data.heroes[hero.index].baseres;

	if (hero.rarity < 5){
		//Subtract 2 from every stat to revert 5* base stats to 1*
		base.hp -= 2;
		base.atk -= 2;
		base.spd -= 2;
		base.def -= 2;
		base.res -= 2;

		//Sort stat bonus order of base stats
		var rarityBaseOrder = ["atk","spd","def","res"];
		var boostPriority = {"hp":4,"atk":3,"spd":2,"def":1,"res":0};
		rarityBaseOrder.sort(function(a,b){
			if(base[a]>base[b]){
				return -1;
			}
			else if(base[a]<base[b]){
				return 1;
			}
			else{
				if(boostPriority[a]>boostPriority[b]){
					return -1;
				}
				else{
					return 1;
				}
			}
		});

		//Push hp last for 3* and 5* since it is 2 stat boost per * (Base -> +2 stat -> +2 stat + hp -> +2 stat -> +2 stat + hp)
		rarityBaseOrder.push("hp");

		//Add bonus to 1* base stats to rarity values
		var rarityBoostCount = Math.floor((hero.rarity-1) * 2.5);
		for(var i = 0; i < rarityBoostCount; i++){
			base[rarityBaseOrder[i%5]]++;
		}
	}

	//Add IV stats
	var growthValMod = {"hp":0,"atk":0,"spd":0,"def":0,"res":0};
	if(hero.boon != "none"){
		growthValMod[hero.boon] += 1;
	}
	if(hero.bane != "none"){
		growthValMod[hero.bane] -= 1;
	}
	base.hp += growthValMod.hp;
	base.atk += growthValMod.atk;
	base.spd += growthValMod.spd;
	base.def += growthValMod.def;
	base.res += growthValMod.res;

	//Print tooltip text
	tooltipText = "<span class=\"bold\">" + data.heroes[hero.index].name + " (";
	if ((hero.boon == "none" && hero.bane == "none") || hero.boon == hero.bane){
		tooltipText += "Neutral";
	}else{
		//Print boon first
		for (var stat in growthValMod){
			if (growthValMod.hasOwnProperty(stat) && growthValMod[stat] > 0) {
				tooltipText += "+" + stat;
			}
		}
		//Print bane second
		for (var stat in growthValMod){
			if (growthValMod.hasOwnProperty(stat) && growthValMod[stat] < 0) {
				tooltipText += "-" + stat;
			}
		}
	}
	tooltipText += ") " + "☆".repeat(hero.rarity) + " </span><br>";
	tooltipText += " Base HP: <font color=\"#fefec8\">" + base.hp + "</font><br>";
	tooltipText += " Base Atk: <font color=\"#fefec8\">" + base.atk + "</font><br>";
	tooltipText += " Base Spd: <font color=\"#fefec8\">" + base.spd + "</font><br>";
	tooltipText += " Base Def: <font color=\"#fefec8\">" + base.def + "</font><br>";
	tooltipText += " Base Res: <font color=\"#fefec8\">" + base.res + "</font><br>";

	$("#frame_tooltip").html(tooltipText).show();
}

function showSkillTooltip(heroType, skillType){
	var hero;
	var skillID;
	var tooltipText;

	//Set hero to selected hero type
	switch (heroType){
		case "challenger":
			hero = challenger;
			break;
		case "list":
			hero = enemies.fl;
			break;
		case "custom":
			(options.customEnemySelected == -1) ? hero = -1 : hero = enemies.cl.list[options.customEnemySelected];
			break;
	}

	//Set skillID to selected skill type
	if (hero == -1){
		skillID = -1;
	}else{
		switch (skillType){
			case "weapon":
				skillID = hero.weapon;
				break;
			case "refine":
				skillID = hero.refine;
				break;
			case "assist":
				skillID = hero.assist;
				break;
			case "special":
				skillID = hero.special;
				break;
			case "a":
				skillID = hero.a;
				break;
			case "b":
				skillID = hero.b;
				break;
			case "c":
				skillID = hero.c;
				break;
			case "s":
				skillID = hero.s;
				break;
			default:
				skillID = -1;
		}
	}

	//If skill is not blank: Show tooltip
	if (skillID != -1){
		showingTooltip = true;

		if(skillType == "refine"){
			tooltipText = "<span class=\"bold\">" + data.refine[skillID].name + " - </span>";
			tooltipText += "<span class=\"bold\">" + data.refine[skillID].category + "</span>";
			tooltipText += " SP: <font color=\"#fefec8\">" + data.refine[skillID].sp + "</font><br>";
			tooltipText += " HP: <font color=\"#fefec8\">" + data.refine[skillID].hp + "</font>";
			tooltipText += " Atk: <font color=\"#fefec8\">" + data.refine[skillID].atk + "</font>";
			tooltipText += " Spd: <font color=\"#fefec8\">" + data.refine[skillID].spd + "</font>";
			tooltipText += " Def: <font color=\"#fefec8\">" + data.refine[skillID].def + "</font>";
			tooltipText += " Res: <font color=\"#fefec8\">" + data.refine[skillID].res + "</font><br>";
			tooltipText += data.refine[skillID].description;
		}
		else{
			tooltipText = "<span class=\"bold\">" + data.skills[skillID].name + "</span>";
			tooltipText += (skillType == "weapon") ? " Mt: <font color=\"#fefec8\">" + data.skills[skillID].atk + "</font>" : "";
			tooltipText += (skillType == "special") ? " CD: <font color=\"#fefec8\">" + data.skills[skillID].charge + "</font>" : "";
			tooltipText += " SP: <font color=\"#fefec8\">" + data.skills[skillID].sp + "</font>";
			tooltipText += (skillType != "weapon" && skillType != "assist" && skillType != "special") ? (data.skills[skillID].affectsduel ? "" : " <font color=\"#dcdcdc\">(non-duel)</font>") : "";
			tooltipText += "<br>";
			tooltipText += data.skills[skillID].description;
		}

		$("#frame_tooltip").html(tooltipText).show();
	}
}

function hideTooltip(){
	showingTooltip = false;
	$("#frame_tooltip").hide();
}

//Clear all turns and add a turn
function resetTurn(turnName){
	for(var initTurn = options.roundInitiators.length; initTurn >= 0; initTurn--){
		$("#turn_" + (options.roundInitiators.length - 1)).hide();
		options.roundInitiators.splice(initTurn,1);
	}
	$("#turn_text_" + options.roundInitiators.length).html(turnName);
	$("#turn_" + options.roundInitiators.length).show();
	$("#turn_image_" + options.roundInitiators.length).attr("src", "ui/" + ((turnName == "Challenger") ? "challenger" : "enemy") + "_sprite.png");
	options.roundInitiators.push(turnName);
	calculate();
}

function addTurn(turnName){
	if(options.roundInitiators.length < 4){
		$("#turn_text_" + options.roundInitiators.length).html(turnName);
		$("#turn_" + options.roundInitiators.length).show();
		$("#turn_image_" + options.roundInitiators.length).attr("src", "ui/" + ((turnName == "Challenger") ? "challenger" : "enemy") + "_sprite.png");
		options.roundInitiators.push(turnName);
	}
	calculate();
}

function deleteTurn(initTurn){
	//keep ids the same, shift around text
	$("#turn_" + (options.roundInitiators.length - 1)).hide();
	options.roundInitiators.splice(initTurn,1);
	for(var i = 0; i < options.roundInitiators.length; i++){
		$("#turn_text_" + i).html(options.roundInitiators[i]);
		$("#turn_image_" + i).attr("src", "ui/" + ((options.roundInitiators[i] == "Challenger") ? "challenger" : "enemy") + "_sprite.png");
	}
	calculate();
}

function copyChallenger(){
	if (challenger.index != -1){
		if (options.customEnemyList != 1){
			options.customEnemyList = 1;
		}
		var hero;
		//Generate a new hero
		enemies.cl.list.push({
			"index":-1,"hp":0,"atk":0,"spd":0,"def":0,"res":0,"weapon":-1,"refine":-1,"assist":-1,"special":-1,"a":-1,"b":-1,"c":-1,"s":-1,
			"buffs": {"hp":0,"atk":0,"spd":0,"def":0,"res":0}, "debuffs": {"hp":0,"atk":0,"spd":0,"def":0,"res":0}, "spur": {"hp":0,"atk":0,"spd":0,"def":0,"res":0},
			"boon":"none", "bane":"none", "summoner":"none", "ally":"none", "bless_1":"none", "bless_2":"none", "bless_3":"none", "merge":0, "rarity":5, "precharge":0,
			"adjacent":1, "adjacent2":1, "adjacent_foe":1, "adjacent2_foe":1, "damage":0
		});
		hero = enemies.cl.list[enemies.cl.list.length - 1];
		//Copy challenger attributes
		cloneHero(hero, challenger);
		var tempStats = {"hp":hero.hp, "atk":hero.atk, "spd":hero.spd, "def":hero.def, "res":hero.res};
		//Init hero and update enemy UI
		initHero(hero, true);
		//Copy stats reset by initHero
		hero.hp = tempStats.hp;
		hero.atk = tempStats.atk;
		hero.spd = tempStats.spd;
		hero.def = tempStats.def;
		hero.res = tempStats.res;
		//Update enemy UI
		options.customEnemySelected = enemies.cl.list.length - 1;
		updateEnemyUI();
		updateClList();
		//Scroll to end of list
		$('#cl_enemylist_list').scrollTop((options.customEnemySelected - 14) * 25 - 10);
		//Update challenger UI and calculate
		updateChallengerUI();
		validateNumberInputs();
		calculate();
	}
}

function copyEnemy(){
	if(options.customEnemyList == 1 && options.customEnemySelected != -1 && enemies.cl.list[options.customEnemySelected].index != -1){
		//Clear current challenger
		challenger.index = -1;
		resetHero(challenger);
		//Copy attributes from enemy
		cloneHero(challenger, enemies.cl.list[options.customEnemySelected]);
		var tempStats = {"hp":challenger.hp, "atk":challenger.atk, "spd":challenger.spd, "def":challenger.def, "res":challenger.res};
		//Init challenger and refresh UI
		initHero(challenger, true);
		//Copy stats reset by initHero
		challenger.hp = tempStats.hp;
		challenger.atk = tempStats.atk;
		challenger.spd = tempStats.spd;
		challenger.def = tempStats.def;
		challenger.res = tempStats.res;
		//Update challenger UI
		updateChallengerUI();
		$("#challenger_name").trigger('change.select2');
		validateNumberInputs();
		calculate();
	}
}

function showImportDialog(side,type){
	//side = challenger or enemies, type = import or export
	var label = "";
	if(type=="import"){
		label = "Import ";
		$("#export_collapse_label").hide();
		$("#importinput").val("");
		setTimeout(function(){
			$("#importinput")[0].focus();
		}, 10); //Because focus will be immediately lost from click
		$("#button_import").html("Import into calculator").off("click").on("click",function(){importText(side)});
	}
	else{
		label = "Export ";
		$("#button_import").html("Copy to clipboard").off("click").on("click",function(){copyExportText()});
		$("#export_collapse_label").show().off("click").on("click",function(){$("#importinput").val(getExportText(side))});
		$("#importinput").val(getExportText(side));
	}

	if(side=="challenger"){
		$("#frame_import").removeClass("enemiesimport").addClass("challengerimport");
		label += "challenger";
	}
	else if(side=="enemies"){
		$("#frame_import").removeClass("enemiesimport").addClass("enemiesimport");
		label += "enemies";
	}

	$("#import_title").html(label);
	$("#button_clear").click(function(){
		$("#importinput").val("");
	})

	$("#screen_fade").show();
	$("#frame_import").show();
}

//Import dialog UI is used for export as well
function hideImportDialog(){
	$("#screen_fade").hide();
	$("#frame_import").hide();
}

function importText(side, customList){
	var errorMsg = "";

	var text = (customList) ? customList : $("#importinput").val();
	//console.log(((customList) ? "I" : "Not i") + "mporting custom list from db.");
	text = removeDiacritics(text); //Fuckin rauðrblade
	var importSplit = text.split(/\n|;/).map(function (line) {
		return line.trim();
	});

	var importMode = "none";
	if(side=="enemies"){
		var firstLine = parseFirstLine(importSplit[0]);
		var firstLineHero = (typeof firstLine.index != "undefined")
		if(includesLike(importSplit[0],"CUSTOM LIST") || firstLineHero){
			var startLine = 1;
			if(firstLineHero){
				startLine = 0;
			}
			importMode = "cl";
			options.customEnemyList = "1";
			removeAllClEnemies();
			var clBlocks = importSplit.slice(startLine).join("!!!").replace(/!!!!!![!]+/g,"!!!!!!").split("!!!!!!");
			for(var clIndex = 0; clIndex < clBlocks.length; clIndex++){
				var clLines = clBlocks[clIndex].split("!!!");
				if(clLines[0].length > 2){
					parseHero(clLines);
				}
			}
			updateClList();
			updateEnemyUI();
			//Scroll to end of list
			$('#cl_enemylist_list').scrollTop((options.customEnemySelected - 14) * 25 - 10);
		}
		//else if(includesLike(importSplit[0],"ENEMIES - FILTERED FULL LIST")){
		else{
			var startLine = 0;
			if(includesLike(importSplit[0],"FILTERED")){
				startLine = 1;
			}
			importMode = "fl";
			options.customEnemyList = "0";
			resetHero(enemies.fl,true);
			var hero = enemies.fl;
			var flLines = importSplit.slice(startLine);
			for(var flLine = 0; flLine < flLines.length; flLine++){
				var lineData = parseAttributeLine(flLines[flLine]);
				for(var key in lineData){
					hero[key] = lineData[key];
				}
			}
			initEnemyList();
			updateFlEnemies();
			updateEnemyUI();
		}
	}
	else{
		var firstLine = parseFirstLine(importSplit[0]);
		if(typeof firstLine.index != "undefined"){
			importMode = "challenger";
			challenger.index = -1;
			resetHero(challenger);
			parseHero(importSplit,firstLine);
			updateChallengerUI();
			$("#challenger_name").trigger('change.select2');
		}
		else{
			errorMsg = "Import challenger failed.";
		}
	}

	function parseHero(lines,firstLine){
		//challenger will pass first line because it needs to parse it to see if it's a challenger
		firstLine = firstLine || parseFirstLine(lines[0]);
		var hero;
		if(importMode == "challenger"){
			hero = challenger;
		}
		else{
			enemies.cl.list.push({
				"index":-1,"hp":0,"atk":0,"spd":0,"def":0,"res":0,"weapon":-1,"refine":-1,"assist":-1,"special":-1,"a":-1,"b":-1,"c":-1,"s":-1,
				"buffs": {"hp":0,"atk":0,"spd":0,"def":0,"res":0}, "debuffs": {"hp":0,"atk":0,"spd":0,"def":0,"res":0}, "spur": {"hp":0,"atk":0,"spd":0,"def":0,"res":0},
				"boon":"none", "bane":"none", "summoner":"none", "ally":"none", "bless_1":"none", "bless_2":"none", "bless_3":"none", "merge":0, "rarity":5, "precharge":0,
				"adjacent":1, "adjacent2":1, "adjacent_foe":1, "adjacent2_foe":1, "damage":0
			});
			hero = enemies.cl.list[enemies.cl.list.length-1];
		}

		hero.index = firstLine.index;
		if(firstLine.rarity){
			hero.rarity = firstLine.rarity;
		}
		else{
			hero.rarity = 5;
		}
		if(firstLine.merge){
			hero.merge = firstLine.merge;
		}
		if(firstLine.boon){
			hero.boon = firstLine.boon;
		}
		if(firstLine.bane){
			hero.bane = firstLine.bane;
		}
		if(firstLine.summoner){
			hero.summoner = firstLine.summoner;
		}
		if(firstLine.ally){
			hero.ally = firstLine.ally;
		}
		if(firstLine.bless_1){
			hero.bless_1 = firstLine.bless_1;
		}
		if(firstLine.bless_2){
			hero.bless_2 = firstLine.bless_2;
		}
		if(firstLine.bless_3){
			hero.bless_3 = firstLine.bless_3;
		}


		//Reset skills - they won't be reset with setSkills
		hero.weapon = -1;
		hero.assist = -1;
		hero.refine = -1;
		hero.special = -1;
		hero.a = -1;
		hero.b = -1;
		hero.c = -1;
		hero.s = -1;

		for(var line = 1; line < lines.length; line++){
			//Check if the line looks like a firstline; If yes, start parsing a new hero
			var firstLine = parseFirstLine(lines[line]);
			if(typeof firstLine.index != "undefined"){
				parseHero(lines.slice(line));
				break;
			}
			else{
				var lineData = parseAttributeLine(lines[line]);
				for(var key in lineData){
					hero[key] = lineData[key];
				}
			}
		}
		initHero(hero,true);
	}

	function parseFirstLine(line){
		var dataFound = {};
		//Try all lengths up to 50 characters to find hero name
		for(var tryLength = 2; tryLength <= 50; tryLength++){
			var tryString = removeEdgeJunk(line.slice(0,tryLength));
			var tryIndex = getIndexFromName(tryString,data.heroes);
			if(tryIndex != -1){
				//console.log(tryString);
				dataFound.index = tryIndex;
				//break; Don't break in case there is a hero with a name that is the beginning of another hero's name
			}
		}

		var tryRarityIndex = line.indexOf("★");
		if(tryRarityIndex == -1){
			tryRarityIndex = line.indexOf("*");
		}
		if(tryRarityIndex != -1){
			var tryRarity = parseInt(line.slice(tryRarityIndex - 1, tryRarityIndex)); //Try left side
			if(tryRarity >= 1 && tryRarity <= 5){
				dataFound.rarity = tryRarity;
			}
			// else{
			// 	tryRarity = parseInt(line.slice(tryRarityIndex + 1, tryRarityIndex+2)); //Try right side
			// 	if(tryRarity >= 1 && tryRarity <= 5){
			// 		dataFound.rarity = tryRarity;
			// 	}
			// }
		}

		var plusSplit = line.split("+");
		if(plusSplit.length > 1){ //Don't check if there's no pluses
			for(var plusLine = 0; plusLine < plusSplit.length; plusLine++){
				plusSplit[plusLine] = removeEdgeJunk(plusSplit[plusLine]).toLowerCase();

				var tryMerge = parseInt(plusSplit[plusLine].slice(0,2));
				if(tryMerge >= 1 && tryMerge <= 10){
					dataFound.merge = tryMerge;
				}
				// else{
				// 	tryMerge = parseInt(plusSplit[plusLine].slice(-2));
				// 	if(tryMerge >= 1 && tryMerge <= 10){
				// 		dataFound.merge = tryMerge;
				// 	}
				// }

				data.stats.forEach(function(stat){
					if(plusSplit[plusLine].slice(0,stat.length) == stat){
						dataFound.boon = stat;
					}
				});
			}
		}

		var minusSplit = line.split("-");
		if(minusSplit.length > 1){ //Don't check if there's no minuses
			for(var minusLine = 0; minusLine < minusSplit.length; minusLine++){
				minusSplit[minusLine] = removeEdgeJunk(minusSplit[minusLine]).toLowerCase();

				data.stats.forEach(function(stat){
					if(minusSplit[minusLine].slice(0,stat.length) == stat){
						dataFound.bane = stat;
					}
				});
			}
		}

		var summonerSplit = line.split("Summoner: ");
		if(summonerSplit.length > 1){ //Don't check if there's no "Summoner: "
			for(var summonerLine = 0; summonerLine < summonerSplit.length; summonerLine++){
				summonerSplit[summonerLine] = removeEdgeJunk(summonerSplit[summonerLine]).toLowerCase();

				data.support.forEach(function(support){
					if(summonerSplit[summonerLine].slice(0,support.length) == support){
						dataFound.summoner = support;
					}
				});
			}
		}

		var allySplit = line.split("Ally: ");
		if(allySplit.length > 1){ //Don't check if there's no "Ally: "
			for(var allyLine = 0; allyLine < allySplit.length; allyLine++){
				allySplit[allyLine] = removeEdgeJunk(allySplit[allyLine]).toLowerCase();

				data.support.forEach(function(support){
					if(allySplit[allyLine].slice(0,support.length) == support){
						dataFound.ally = support;
					}
				});
			}
		}

		var blessSplit = line.split("Bless: ");
		if(blessSplit.length > 1){ //Don't check if there's no "Bless: "

			for(var blessLine = 0; blessLine < blessSplit.length; blessLine++){
				blessSplit[blessLine] = removeEdgeJunk(blessSplit[blessLine]).toLowerCase();
				//console.log(blessSplit[blessLine]);

				//First Bless Check
				data.blessType.forEach(function(blessType){
					if(blessSplit[blessLine].slice(0,blessType.length) == blessType){
						dataFound.bless_1 = blessType;
					}
				});
				//Second Bless Check
				if (dataFound.bless_1 && blessSplit[blessLine].substring(3).length >= 3){
					data.blessType.forEach(function(blessType){
						if(blessSplit[blessLine].substring(3).slice(0,blessType.length) == blessType){
							dataFound.bless_2 = blessType;
						}
					});
				}
				//Third Bless Check
				if (dataFound.bless_2 && blessSplit[blessLine].substring(6).length >= 3){
					data.blessType.forEach(function(blessType){
						if(blessSplit[blessLine].substring(6).slice(0,blessType.length) == blessType){
							dataFound.bless_3 = blessType;
						}
					});
				}
			}
		}

		return dataFound;
	}

	function parseAttributeLine(line){
		var dataFound = {};

		var keyValue = trySplit(line,[":","-","="]);
		keyValue[0] = removeEdgeJunk(keyValue[0]);
		if(keyValue.length==1){
			keyValue[1] = "";
		}
		keyValue[1] = removeEdgeJunk(keyValue[1].toLowerCase());
		var key = "";
		var value;
		var buffObject = false;
		var skillName = false;
		var includeObject = false;
		if(includesLike(keyValue[0],"debuff")){ //do debuff first, because buff is contained in it
			key = "debuffs";
			buffObject = true;
		}
		else if(includesLike(keyValue[0],"buff")){
			key = "buffs";
			buffObject = true;
		}
		else if(includesLike(keyValue[0],"spur")){
			key = "spur";
			buffObject = true;
		}
		else if(includesLike(keyValue[0],"charge")){
			key = "precharge";
		}
		//TODO: Implement Adjacent Import/Export
		else if(includesLike(keyValue[0],"adjacent")){
			key = "adjacent";
		}
		else if(includesLike(keyValue[0],"damage")){
			key = "damage";
		}
		else if(includesLike(keyValue[0],"rarity")){
			key = "rarity";
		}
		else if(includesLike(keyValue[0],"merge")){
			key = "merge";
		}
		else if(includesLike(keyValue[0],"boon")){
			key = "boon";
		}
		else if(includesLike(keyValue[0],"bane")){
			key = "bane";
		}
		else if(includesLike(keyValue[0],"summoner")){
			key = "summoner";
		}
		else if(includesLike(keyValue[0],"ally")){
			key = "ally";
		}
		else if(includesLike(keyValue[0],"bless")){
			key = "bless";
		}
		else if(includesLike(keyValue[0],"include")){
			key = "include";
			includeObject = true;
		}
		else if(includesLike(keyValue[0],"weapon")){
			key = "weapon";
			skillName = true;
		}
		else if(includesLike(keyValue[0],"refine")){
			key = "refine";
		}
		else if(includesLike(keyValue[0],"assist")){
			key = "assist";
			skillName = true;
		}
		else if(includesLike(keyValue[0],"special")){
			key = "special";
			skillName = true;
		}
		else if(includesLike(keyValue[0],"passive a") || keyValue[0].toLowerCase().slice(-1) == "a"){
			key = "a";
			skillName = true;
		}
		else if(includesLike(keyValue[0],"passive b") || keyValue[0].toLowerCase().slice(-1) == "b"){
			key = "b";
			skillName = true;
		}
		else if(includesLike(keyValue[0],"passive c") || keyValue[0].toLowerCase().slice(-1) == "c"){
			key = "c";
			skillName = true;
		}
		else if(includesLike(keyValue[0],"passive s") || keyValue[0].toLowerCase().slice(-1) == "s"){
			key = "s";
			skillName = true;
		}

		if(includesLike(keyValue[0],"replace") && skillName){
			key = "replace" + capitalize(key);
			skillName = false;
		}

		if(buffObject){
			var value = {"hp":0,"atk":0,"spd":0,"def":0,"res":0};
			var splitBuffs = trySplit(keyValue[1],[","]);
			for(var i = 0; i < splitBuffs.length; i++){
				data.buffStats.forEach(function(stat){
					if(includesLike(splitBuffs[i],stat)){
						var numMatch = splitBuffs[i].match(/-?[0-9]+/);
						if(numMatch){
							value[stat] = parseInt(numMatch[0]);
						}
					}
				});
			}
		}
		else if(skillName){
			value = getIndexFromName(removeEdgeJunk(keyValue[1]),data.skills,key);
			//console.log("Looking for " + key + ", found " + value);
		}
		else if(key == "refine"){
			value = searchRefineIndex(keyValue[1].split(" - "));
		}
		else if(key=="boon" || key=="bane"){
			data.stats.forEach(function(stat){
				if(keyValue[1].indexOf(stat) != -1){
					value = stat;
				}
			});
		}
		else if(key == "summoner" || key == "ally"){
			data.support.forEach(function(support){
				if(keyValue[1].indexOf(support) != -1){
					value = support;
				}
			});
		}
		//TODO: Check if this is working properly
		else if(key == "bless"){
			data.blessType.forEach(function(blessType){
				if(keyValue[1].indexOf(blessType) != -1){
					value = blessType;
					//dataFound["blessStack"] = parseInt(keyValue[1].replace( /^\D+/g, ''));
				}
			});
		}
		else if(includeObject){
			var value = {"melee":0,"ranged":0,"red":0,"blue":0,"green":0,"gray":0,"physical":0,"magical":0,"infantry":0,"cavalry":0,"flying":0,"armored":0,"staff":0,"nonstaff":0};
			var splitInclude = trySplit(keyValue[1],[","," "]);
			for(var i = 0; i < splitInclude.length; i++){
				for(var includeKey in value){
					if(removeEdgeJunk(splitInclude[i]) == includeKey){
						value[includeKey] = 1;
					}
				}
			}
		}
		else{
			//Make all numbers
			keyValue[1] = keyValue[1].replace("true","1");
			keyValue[1] = keyValue[1].replace("false","0");
			var numMatch = keyValue[1].match(/-?\d/);
			if(numMatch){
				value = parseInt(numMatch[0]);
			}
		}

		//console.log(key + ": " + value + " (from " + keyValue[1] + ")");

		if(key && typeof value != "undefined"){
			dataFound[key] = value;
		}

		return dataFound;
	}

	if(errorMsg){
		alert("Error: " + errorMsg);
	}

	validateNumberInputs();
	hideImportDialog();
	calculate();
}

//Load custom list from google spreadsheet
//Using API 2.0 that acquires public feed without an API key
function loadCustomList(index){
	var listText = "";

	var key = data.lists[index].key;
	var range = data.lists[index].range;
	var url = "https://spreadsheets.google.com/feeds/cells/" + key + "/od6/public/basic?alt=json" + range;

	/* Asynchronous AJAX
	$.ajax({
		url:url,
		dataType:"jsonp",
		async: false,
		success:function(data) {
			// data.feed.entry is an array of objects that represent each cell
			data.feed.entry.forEach(function(entry, index){
				listText += entry.content.$t + ";";
			});
		},
	});
	*/
	try {
		loadJSON(url).feed.entry.forEach(function(entry, index){
			listText += entry.content.$t + ";";
		});
	}catch (error){
		console.log("Invalid url key or range");
	}

	//console.log(listText);
	importText("enemies", listText);
}

//Search for refine index by weapon name and refine name
function searchRefineIndex(refine){
	for (var i = 0; i < data.refine.length; i++){
		if (data.refine[i].prereq.toLowerCase().split(",").indexOf(refine[0]) != -1 && refine[1] == data.refine[i].name.toLowerCase()){
			return i;
		}
	}
	//Refine not found
	return -1;
}

function removeEdgeJunk(string){
	return string.replace(/^[\s\._\-]+/, "").replace(/[\s\._\-]+$/, "");
}

//Try to find a string in mainText that's sorta like findText
function includesLike(mainText,findText){
	mainText = mainText.toLowerCase().replace(/[\s\._\-]+/g, "");
	findText = findText.toLowerCase().replace(/[\s\._\-]+/g, "");
	return mainText.indexOf(findText) != -1;
}

function trySplit(string,splits){
	for(var i = 0; i < splits.length; i++){
		var stringSplit = string.split(splits[i]);
		if(stringSplit.length > 1){
			return stringSplit;
		}
	}

	return [string];
}

function getExportText(side){
	var delimiter = "  \n";
	if($("#export_collapse").is(":checked")){
		delimiter = ";";
	}

	var exportText = "";
	if(side=="challenger"){
		exportText = getHeroExportText(challenger);
	}
	else if(options.customEnemyList==1){
		if(enemies.cl.list.length){
			//exportText = "ENEMIES - CUSTOM LIST" + delimiter;
			for(var i = 0; i < enemies.cl.list.length; i++){
				exportText += getHeroExportText(enemies.cl.list[i]) + delimiter;
			}
		}
	}
	else{
		exportText = "ENEMIES - FILTERED FULL LIST" + delimiter;
		var includeList = [];
		for(var key in enemies.fl.include){
			if(enemies.fl.include[key]){
				includeList.push(key);
			}
		}
		exportText += "Include: " + includeList.join(", ") + delimiter;

		exportText += "Rarity: " + enemies.fl.rarity + "★" + delimiter;
		if(enemies.fl.merge > 0){
			exportText += "Merge: +" + enemies.fl.merge + delimiter;
		}
		if(enemies.fl.boon != "none"){
			exportText += "Boon: +" + enemies.fl.boon + delimiter;
		}
		if(enemies.fl.bane != "none"){
			exportText += "Bane: -" + enemies.fl.bane + delimiter;
		}
		if(enemies.fl.summoner != "none"){
			exportText += "Summoner: " + enemies.fl.summoner + delimiter;
		}
		if(enemies.fl.ally != "none"){
			exportText += "Ally: " + enemies.fl.ally + delimiter;
		}
		if(enemies.fl.bless_1 != "none" || enemies.fl.bless_2 != "none" || enemies.fl.bless_3 != "none"){
			exportText += "Bless: " + enemies.fl.bless_1 + enemies.fl.bless_2 + enemies.fl.bless_3 + delimiter;
		}

		data.skillSlots.forEach(function(slot){
			if(enemies.fl[slot] != -1){
				if (slot == "refine"){
					exportText += capitalize(slot) + ": " + data.refine[enemies.fl[slot]].name + " - " + data.refine[enemies.fl[slot]].category + delimiter;
					exportText += "Replace " + capitalize(slot) + ": " + !!parseInt(enemies.fl["replace" + capitalize(slot)]) + delimiter;
				}else{
					exportText += capitalize(slot) + ": " + data.skills[enemies.fl[slot]].name + delimiter;
					exportText += "Replace " + capitalize(slot) + ": " + !!parseInt(enemies.fl["replace" + capitalize(slot)]) + delimiter;
				}
			}
		});

		var statusText = "";
		data.buffTypes.forEach(function(buffType){
			var notZero = [];
			data.buffStats.forEach(function(stat){
				if(enemies.fl[buffType][stat] != 0){
					notZero.push(stat + " " + enemies.fl[buffType][stat]);
				}
			});
			if(notZero.length){
				statusText += capitalize(buffType) + ": " + notZero.join(", ") + delimiter;
			}
		});

		if(enemies.fl.damage != 0){
			statusText += "Damage: " + enemies.fl.damage + delimiter;
		}
		if(enemies.fl.precharge != 0){
			statusText += "Charge: " + enemies.fl.precharge + delimiter;
		}
		//TODO: Implement Adjacent Import/Export
		if(enemies.fl.adjacent != 1){
			statusText += "Adjacent: " + enemies.fl.adjacent + delimiter;
		}

		if(statusText){
			exportText += ":::Status" + delimiter+statusText;
		}
	}

	//Helper function for single heroes
	function getHeroExportText(hero){
		var heroExportText = "";
		if(hero.index != -1){
			heroExportText += data.heroes[hero.index].name + " (" + hero.rarity + "★";
			if(hero.merge > 0){
				heroExportText += "+" + hero.merge;
			}
			if(hero.boon != "none"){
				heroExportText += " +" + hero.boon;
			}
			if(hero.bane != "none"){
				heroExportText += " -" + hero.bane;
			}
			if(hero.summoner != "none"){
				heroExportText += " Summoner: " + hero.summoner;
			}
			if(hero.ally != "none"){
				heroExportText += " Ally: " + hero.ally;
			}
			if(hero.bless_1 != "none" || hero.bless_2 != "none" || hero.bless_3 != "none"){
				heroExportText += " Bless: " + (hero.bless_1 == "none" ? "" : hero.bless_1) + (hero.bless_2 == "none" ? "" : hero.bless_2) + (hero.bless_3 == "none" ? "" : hero.bless_3);
			}
			heroExportText += ")" + delimiter;

			//Might not do it this way because order is not guaranteed
			data.skillSlots.forEach(function(slot){
				if(hero[slot] != -1){
					if(slot == "refine"){
						heroExportText += capitalize(slot) + ": " + data.skills[hero.weapon].name + " - " + data.refine[hero[slot]].name + delimiter;
					}else{
						heroExportText += capitalize(slot) + ": " + data.skills[hero[slot]].name + delimiter;
					}

				}
			});

			var statusText = "";
			data.buffTypes.forEach(function(buffType){
				var notZero = [];
				data.buffStats.forEach(function(stat){
					if(hero[buffType][stat] != 0){
						notZero.push(stat + " " + hero[buffType][stat]);
					}
				});
				if(notZero.length){
					statusText += capitalize(buffType) + ": " + notZero.join(", ") + delimiter;
				}
			});

			if(hero.damage != 0){
				statusText += "Damage: " + hero.damage + delimiter;
			}
			if(hero.precharge != 0){
				statusText += "Charge: " + hero.precharge + delimiter;
			}
			//TODO: Implement Adjacent Import/Export
			if(hero.adjacent != 1){
				statusText += "Adjacent: " + hero.adjacent + delimiter;
			}

			if(statusText){
				heroExportText += ":::Status" + delimiter + statusText;
			}
		}
		return heroExportText;
	}

	if(!exportText){
		//Rude comment if nothing is exported
		exportText = "Nothing. You've exported nothing.";
	}
	return exportText;
}

function copyExportText(){
	$("#importinput")[0].select();
	var successful = document.execCommand('copy');
	if(!successful){
		$("#button_import").html("Ctrl+C to finish the job")
	}

	hideImportDialog();
}

function switchEnemySelect(newVal){
	var willCalculate = false;
	if(newVal != options.customEnemyList){
		willCalculate = true;
	}
	options.customEnemyList = newVal;
	if(options.customEnemyList == 0){
		$("#enemies_custom_list").hide();
		$("#enemies_full_list").show();
	}else if(options.customEnemyList == 1){
		$("#enemies_full_list").hide();
		$("#enemies_custom_list").show();
	}else{
		$("#enemies_full_list").hide();
		$("#enemies_custom_list").show();
		//index - 2 because enemies_mode starts with 2 options
		loadCustomList(options.customEnemyList - 2);
		options.customEnemyList = 1;
		$("#enemies_mode").trigger('change.select2');
	}

	if(willCalculate){
		calculate();
	}
}

//changedNumber: Whether the number of enemies has changed - must do more intensive updating if this is the case
function updateClList(){
	var lastEnemy = enemies.cl.list.length - 1;
	//Set selected enemy if there are enemies but none is selected
	if(lastEnemy != -1 && options.customEnemySelected == -1){
		options.customEnemySelected = lastEnemy;
	}
	var lastElement = -1;
	var enemyElements = $(".cl_enemy");
	$(".clSelected").removeClass("clSelected");
	//Show/hide existing elements based on number currently in list
	for(var element = 0; element < enemyElements.length; element++){
		var clIndex = parseInt($(enemyElements[element]).attr("data-clindex"));
		if(clIndex > lastElement){
			lastElement = clIndex;
		}
		if(clIndex <= lastEnemy){
			//Update the text of the items in the list
			var enemyIndex = enemies.cl.list[clIndex].index;
			var enemyName = "New Hero";
			if(enemyIndex >= 0){
				enemyName = data.heroes[enemyIndex].name;
			}
			$("#cl_enemy" + clIndex + "_name").html(enemyName);
			if(clIndex == options.customEnemySelected){
				$("#cl_enemy" + clIndex).addClass("clSelected");
			}
			$(enemyElements[element]).show();
		}
		else{
			$(enemyElements[element]).hide();
		}
	}

	//Create new elements if needed
	for(var clIndex = lastElement + 1; clIndex <= lastEnemy; clIndex++){
		//Update the text of the items in the list
		var enemyIndex = enemies.cl.list[clIndex].index;
		var enemyName = "New enemy";
		if(enemyIndex >= 0){
			enemyName = data.heroes[enemyIndex].name;
		}

		//Need to create a new element - the list is not pre-populated with hidden elements
		var clEnemyHTML = "<div class=\"cl_enemy button\" id=\"cl_enemy" + clIndex
			+ "\" data-clindex=\"" + clIndex
			+ "\" onclick=\"selectClEnemy(" + clIndex
			+ ")\"><span id=\"cl_enemy" + clIndex
			+ "_name\">" + enemyName
			+ "</span><div class=\"cl_delete_enemy button\" id=\"cl_enemy" + clIndex
			+ "_delete\" onclick=\"deleteClEnemy(event," + clIndex
			+ ");\" onmouseover=\"undoClStyle(this)\" onmouseout=\"redoClStyle(this)\">x</div></div>";
		$("#cl_enemylist_list").append(clEnemyHTML);
	}

	//Update select2 List
	updateEnemyList();
}

function undoClStyle(element){
	$(element).parent().addClass("cl_destyled");
}

function redoClStyle(element){
	$(element).parent().removeClass("cl_destyled");
}

function validateNumberInputs(){
	//For import function
	$("input[type=number]").toArray().forEach(function(element){
		var min = $(element).attr("min");
		var max = $(element).attr("max");
		if(typeof min != "undefined" && typeof max != "undefined"){
			var newVal = verifyNumberInput(element,min,max);
			var dataVar = $(element).attr("data-var");
			changeDataVar(dataVar, newVal);
			$(element).val(newVal);
		}
	});
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

//Functions that get shit done

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

function fight(enemyIndex,resultIndex){
	//passed resultIndex for tooltip
	//returns object with: rounds, fightText, enemy, challenger,outcome, fightHTML, and passFilters

	var fightText = "";

	var ahChallenger = new activeHero(challenger);
	var ahEnemy;

	var enemyList = [];
	if(options.customEnemyList==1){
		enemyList = enemies.cl.list;
	}
	else{
		enemyList = enemies.fl.list;
	}

	ahEnemy = new activeHero(enemyList[enemyIndex]);

	var rounds = 0;
	var challengerBuffRound = 0;
	var challengerDebuffRound = 0;
	var enemyBuffRound = 0;
	var enemyDebuffRound = 0;

	for(var round = 1; round <= options.roundInitiators.length;round++){
		rounds = round;
		fightText += "<div class=\"fight_round\"><span class=\"bold\">Round " + round + ": ";
		if(options.roundInitiators[round-1]=="Challenger"){
			fightText += ahChallenger.name + " initiates</span><br>";
			if (round >= options.buffStartTurn) challengerBuffRound++;
			if (round >= options.debuffStartTurn) challengerDebuffRound++;
			fightText += ahChallenger.attack(ahEnemy, round, challengerBuffRound, challengerDebuffRound, false);
		}
		else{
			fightText += ahEnemy.name + " initiates</span><br>";
			if (round >= options.buffStartTurn) enemyBuffRound++;
			if (round >= options.debuffStartTurn) enemyDebuffRound++;
			fightText +=  ahEnemy.attack(ahChallenger, round, enemyBuffRound, enemyDebuffRound, false);
		}
		if(ahEnemy.hp <= 0 || ahChallenger.hp <= 0){
			break;
		}
		fightText += "</div>";
	}

	var outcome = "";
	var resultText = "";
	if(ahChallenger.hp<=0){
		outcome = "loss";
		resultText += "<span class=\"red\">loss</span>, " + rounds;
	}
	else if(ahEnemy.hp<=0){
		outcome = "win";
		resultText += "<span class=\"blue\">win</span>, " + rounds;
	}
	else{
		outcome = "inconclusive";
		resultText += "inconclusive";
	}

	if(outcome != "inconclusive"){
		if(rounds==1){
			resultText += " round";
		}
		else{
			resultText += " rounds";
		}
	}

	if(outcome == "win" || outcome == "loss"){
		if(ahEnemy.overkill){
			resultText += ", <span class=\"purple\">" + ahEnemy.overkill + "</span> overkill";
		}
		else if(ahChallenger.overkill){
			resultText += ", <span class=\"purple\">" + ahChallenger.overkill + "</span> overkill";
		}
	}

	//Set icon names
	var weaponName = "None";
	var refineName = "norefine";
	var assistName = "None";
	var specialName = "None";
	var aName = "noskill";
	var bName = "noskill";
	var cName = "noskill";
	var sName = "noskill";
	if(ahEnemy.weaponIndex != -1){
		weaponName = data.skills[ahEnemy.weaponIndex].name;
	}
	if(ahEnemy.refineIndex != -1){
		refineName = data.refine[ahEnemy.refineIndex].name.replace(/\s/g,"_");
	}
	if(ahEnemy.assistIndex != -1){
		assistName = data.skills[ahEnemy.assistIndex].name;
	}
	if(ahEnemy.specialIndex != -1){
		specialName = data.skills[ahEnemy.specialIndex].name;
	}
	if(ahEnemy.aIndex != -1){
		aName = data.skills[ahEnemy.aIndex].name.replace(/\s/g,"_");
	}
	if(ahEnemy.bIndex != -1){
		bName = data.skills[ahEnemy.bIndex].name.replace(/\s/g,"_");
	}
	if(ahEnemy.cIndex != -1){
		cName = data.skills[ahEnemy.cIndex].name.replace(/\s/g,"_");
	}
	if(ahEnemy.sIndex != -1){
		sName = data.skills[ahEnemy.sIndex].name.replace(/\s/g,"_");
	}

	//Set weapon icon name for dragon
	var weaponTypeName = ahEnemy.weaponType;
	if(weaponTypeName == "dragon"){
		weaponTypeName = ahEnemy.color + "dragon";
	}

	//Set weapon icon name for bow
	if (weaponTypeName == "bow"){
		weaponTypeName = ahEnemy.color + "bow";
	}

	//Set weapon icon name for dagger
	if (weaponTypeName == "dagger"){
		weaponTypeName = ahEnemy.color + "dagger";
	}

	if(typeof enemyList[enemyIndex].lastFightResult == "undefined"){
		enemyList[enemyIndex].lastFightResult = "";
	}

	var passFilters = ["all"];
	passFilters.push(outcome);

	//Filter Color
	if (weaponTypeName == "sword" || weaponTypeName == "redtome" || weaponTypeName == "redbow" || weaponTypeName == "reddagger" ||weaponTypeName == "reddragon"){
		passFilters.push("red");
	}else if (weaponTypeName == "lance" || weaponTypeName == "bluetome" || weaponTypeName == "bluebow" || weaponTypeName == "bluedagger" ||weaponTypeName == "bluedragon"){
		passFilters.push("blue");
	}else if (weaponTypeName == "axe" || weaponTypeName == "greentome" || weaponTypeName == "greenbow" || weaponTypeName == "greendagger" ||weaponTypeName == "greendragon"){
		passFilters.push("green");
	}else{
		passFilters.push("gray");
	}
	//Filter Range
	if (data.rangedWeapons.indexOf(weaponTypeName) > -1){
		passFilters.push("ranged");
	}else{
		passFilters.push("melee");
	}
	//Filter  Type
	if (ahEnemy.moveType == "infantry"){
		passFilters.push("infantry");
	}else if (ahEnemy.moveType == "armored"){
		passFilters.push("armored");
	}else if (ahEnemy.moveType == "flying"){
		passFilters.push("flying");
	}else if (ahEnemy.moveType == "cavalry"){
		passFilters.push("cavalry");
	}

	if(enemyList[enemyIndex].lastFightResult){
		var prevResult = "";
		if(enemyList[enemyIndex].lastFightResult.indexOf("win") > -1){
			prevResult = "win";
		}
		else if(enemyList[enemyIndex].lastFightResult.indexOf("loss") > -1){
			prevResult = "loss";
		}
		else if(enemyList[enemyIndex].lastFightResult.indexOf("inconclusive") > -1){
			prevResult = "inconclusive";
		}

		if(outcome != prevResult){
			passFilters.push("changeVictor");
		}

		var prevRoundsMatch = enemyList[enemyIndex].lastFightResult.match(/([1-4]) rounds?/);
		var prevRounds = 0;
		if(prevRoundsMatch){
			prevRounds = prevRoundsMatch[1];
		}

		if(rounds != prevRounds && outcome == prevResult && outcome != "inconclusive"){
			//changeRounds means rounds changed but not result
			passFilters.push("changeRounds");
		}

		var prevHealthMatch = enemyList[enemyIndex].lastFightResult.match(/([0-9]+)<\/span> &ndash; <span class="red">([0-9]+)/);
		var prevOverkillMatch = enemyList[enemyIndex].lastFightResult.match(/([0-9]+)<\/span> overkill/);
		var prevChallengerEndHealth;
		var prevEnemyEndHealth;
		var prevOverkill;

		var currentChallengerEndHealth = ahChallenger.hp;
		var currentEnemyEndHealth = ahEnemy.hp;
		if(ahEnemy.overkill){
			currentEnemyEndHealth -= ahEnemy.overkill;
		}
		else if(ahChallenger.overkill){
			currentChallengerEndHealth -= ahChallenger.overkill;
		}

		if(prevHealthMatch){
			prevChallengerEndHealth = parseInt(prevHealthMatch[1]);
			prevEnemyEndHealth = parseInt(prevHealthMatch[2]);
		}

		if(prevOverkillMatch){
			prevOverkill = parseInt(prevOverkillMatch[1]);

			if(prevChallengerEndHealth == 0){
				prevChallengerEndHealth -= prevOverkill;
			}
			else if(prevEnemyEndHealth == 0){
				prevEnemyEndHealth -= prevOverkill;
			}

		}

		if(rounds == prevRounds && outcome == prevResult && (currentChallengerEndHealth != prevChallengerEndHealth || currentEnemyEndHealth != prevEnemyEndHealth)){
			passFilters.push("changeDamage");
		}
	}

	//Do Buff and Debuff UI here
	var statChange = {"hp":0,"atk":0,"spd":0,"def":0,"res":0};
	data.stats.forEach(function(stat){
		statChange[stat] = ahEnemy.buffs[stat] + ahEnemy.debuffs[stat] + ahEnemy.spur[stat];
	});
	var statChangeText = {"hp":"","atk":"","spd":"","def":"","res":""};
	data.stats.forEach(function(stat){
		if (statChange[stat] != 0){
			if (statChange[stat] > 0){
				statChangeText[stat] = "<font color=\"99C68E\"> (+" + statChange[stat] + ")</font>";
			}else{
				statChangeText[stat] = "<font color=\"FAAFBE\"> (" + statChange[stat] + ")</font>";
			}
		}
	});

	//Do statistic collection here
	collectStatistics(ahChallenger, ahEnemy, outcome);

	//Hero portrait
	var portraitName = ahEnemy.realName;
	if (data.heroes[ahEnemy.heroIndex].name.indexOf("Generic") != -1){
		if(data.heroes[ahEnemy.heroIndex].weapontype == "dragon" || data.heroes[ahEnemy.heroIndex].weapontype == "bow" ){
			portraitName = "generic/" + data.heroes[ahEnemy.heroIndex].movetype + "_" + data.heroes[ahEnemy.heroIndex].color + data.heroes[ahEnemy.heroIndex].weapontype;
		}else{
			portraitName = "generic/" + data.heroes[ahEnemy.heroIndex].movetype + "_" + data.heroes[ahEnemy.heroIndex].weapontype;
		}
	}

	//Generate fight HTML
	fightHTML = ["<div class=\"results_entry\" id=\"result_" + resultIndex + "\" onmouseover=\"showResultsTooltip(event,this);\" onmouseout=\"hideTooltip();\">",
		"<div class=\"results_hpbox\">",
			"<div class=\"results_hplabel\">HP</div>",
			"<div class=\"results_hpnums\">",
				"<span class=\"results_challengerhp\">" + ahChallenger.hp + "</span> &ndash; <span class=\"results_enemyhp\">" + ahEnemy.hp + "</span>",
			"</div>",
		"</div>",
		"<div class=\"frame_enemypicture\"><img class=\"results_enemypicture\" src=\"heroes/" + portraitName + ".png\"/><img class=\"movementIconSmall\" src=\"weapons/" + ahEnemy.moveType + ".png\"/></div>",
		"<div class=\"results_topline\">",
			"<img class=\"weaponIconSmall\" src=\"weapons/" + weaponTypeName + ".png\"/><span class=\"results_enemyname\">" + ahEnemy.realName + "</span> (<span class=\"results_outcome\">" + resultText + "</span>)",
			"<div class=\"results_previousresult\">" + enemyList[enemyIndex].lastFightResult + "</div>",
		"</div>",
		"<div class=\"results_bottomline\">",
			"<span class=\"results_stat\">HP: " + ahEnemy.maxHp + "</span>",
			"<span class=\"results_stat\">Atk: " + ahEnemy.atk + statChangeText.atk + "</span>",
			"<span class=\"results_stat\">Spd: " + ahEnemy.spd + statChangeText.spd + "</span>",
			"<span class=\"results_stat\">Def: " + ahEnemy.def + statChangeText.def + "</span>",
			"<span class=\"results_stat\">Res: " + ahEnemy.res + statChangeText.res + "</span>",
			"<div class=\"results_skills\">",
				"<span class=\"results_stat\"><img class=\"skill_picture\" src=\"skills/weapon.png\"/><img class=\"skill_picture\" src=\"weapons/" + refineName + ".png\"/>" + weaponName + "</span>",
				//"<span class=\"results_stat\"><img class=\"skill_picture\" src=\"skills/assist.png\"/>" + assistName + "</span>",
				"<span class=\"results_stat\"><img class=\"skill_picture\" src=\"skills/special.png\"/>" + specialName + "</span>",
				"<span class=\"results_stat\"><img class=\"skill_picture\" src=\"skills/" + aName + ".png\"/><img class=\"skill_picture\" src=\"skills/" + bName + ".png\"/><img class=\"skill_picture\" src=\"skills/" + cName + ".png\"/><img class=\"skill_picture\" src=\"skills/" + sName + ".png\"/></span>",
			"</div>",
		"</div>",
	"</div>",""].join("\n");

	enemyList[enemyIndex].lastFightResult = "Previous result: " + resultText + ", <span class=\"blue\">" + ahChallenger.hp + "</span> &ndash; <span class=\"red\">" + ahEnemy.hp + "</span>";

	return {
		"rounds":rounds,
		"fightText":fightText,
		"enemy":ahEnemy,
		"challenger":ahChallenger,
		"outcome":outcome,
		"fightHTML":fightHTML,
		"passFilters":passFilters
	};
}

function calcuWait(ms){//har har har
	//Waits to calculate on inputs like numbers that may be clicked a lot in a short time
	calcuwaitTime = ms;
	if(!calcuwaiting){
		calcuwaiting = true;
		calcuwaitTimer();
	}
}

function calcuwaitTimer(){
	if(calcuwaitTime <= 0){
		calcuwaiting = false;
		calculate();
	}
	else{
		calcuwaitTime -= 50;
		setTimeout(calcuwaitTimer,50);
	}
}

function calculate(manual){
	//console.log("calculated");
	//manual = true if button was clicked
	//calculates results and also adds them to page
	if(options.autoCalculate || manual){

		//Reset statistics
		resetStatistics();

		//Do calculations
		if(challenger.index!=-1 && options.roundInitiators.length > 0 && enemies.fl.list.length > 0){
			var wins = 0;
			var losses = 0;
			var inconclusive = 0;

			fightResults = [];
			resultHTML = [];

			var enemyList = [];
			var mustConfirm = false;
			if(options.customEnemyList == 1){
				enemyList = enemies.cl.list;
			}
			else{
				enemyList = enemies.fl.list;
				mustConfirm = true;
			}
			for(var i = 0;i<enemyList.length;i++){
				if(enemyList[i].index >= 0 && !mustConfirm || enemyList[i].included){
					//Push valid enemy into statistics enemies list
					statistics.enemies.list.push(enemyList[i]);
					//Do fight and push into results
					fightResults.push(fight(i,fightResults.length));
				}
			}

			for(var i = 0; i < fightResults.length;i++){

				if(fightResults[i].outcome=="loss"){
					losses++;
				}
				else if(fightResults[i].outcome=="win"){
					wins++;
				}
				else{
					inconclusive++;
				}

				resultHTML.push({sortWeight:getComparisonWeight(fightResults[i]), html:fightResults[i].fightHTML, passFilters:fightResults[i].passFilters});
			}

			resultHTML.sort(function(a,b){
				//sort fights from best wins to worst losses
				//first by win, then by rounds, then by hp
				if(a.sortWeight == b.sortWeight){
					return 0;
				}
				else{
					return (a.sortWeight < b.sortWeight)*2-1;
				}
			});

			//Update statistics
			updateStatisticsUI();

			outputResults();
			var total = wins + losses + inconclusive;
			$("#results_graph_wins").animate({"width":(wins/total) * ($("#frame_main").width() - 4) + "px"},200);
			$("#results_graph_losses").animate({"width":(losses/total) * ($("#frame_main").width() - 4) + "px"},200);
			$("#win_pct").html(wins);
			$("#lose_pct").html(losses);
			$("#inconclusive_pct").html(inconclusive);
		}
		else{
			$("#results_graph_wins").animate({"width":"0px"},200);
			$("#results_graph_losses").animate({"width":"0px"},200);
			$("#win_pct").html("-");
			$("#lose_pct").html("-");
			$("#inconclusive_pct").html("-");
			$("#results_list").html("");
		}
	}
}

function getComparisonWeight(fightResult){
	var weight = 0;
	if(fightResult.enemy.hp <= 0){
		weight += 100;
	}
	else{
		weight += (1 - (fightResult.enemy.hp / fightResult.enemy.maxHp)) * 40;
	}
	if(fightResult.challenger.hp <= 0){
		weight -= 100;
	}
	else{
		weight -= (1 - (fightResult.challenger.hp / challenger.hp)) * 40;
	}
	weight /= fightResult.rounds;
	//console.log(fightResult.challenger.hp + " - " + fightResult.enemy.hp + ", " + fightResult.rounds + "rnd: " + weight);
	return weight;
}

function outputResults(){
	//function separate from calculation so user can re-sort without recalculating
	//Hide results that aren't different if view is set to changed only
	//options.viewFilter is 0 or 1 or 2
	var outputHTML = "";

	if(options.sortOrder == "best"){
		for(var i = 0; i < resultHTML.length; i++){
			if(filterResult(i)){
				outputHTML += resultHTML[i].html;
			}
		}
	}
	else if(options.sortOrder == "worst"){
		for(var i = resultHTML.length-1; i >= 0; i--){
			if(filterResult(i)){
				outputHTML += resultHTML[i].html;
			}
		}
	}
	$("#results_list").html(outputHTML);
}

//Helper function for filtering
//Will return true if include or false if not
function filterResult(i){
	//console.log(options.viewFilter);
	//console.log(resultHTML[i].passFilters.indexOf(options.viewFilter));
	//console.log(resultHTML[i].passFilters);
	//return resultHTML[i].passFilters.indexOf(options.viewFilter) > -1;

	//Color Filter
	if (resultHTML[i].passFilters.indexOf(options.colorFilter) == -1){
		return false
	}
	//Range Filter
	if (resultHTML[i].passFilters.indexOf(options.rangeFilter) == -1){
		return false
	}
	//Type Filter
	if (resultHTML[i].passFilters.indexOf(options.typeFilter) == -1){
		return false
	}
	//View Filter
	if (resultHTML[i].passFilters.indexOf(options.viewFilter) == -1){
		return false
	}
	//Return true if all filter passes
	return true;
}

function exportCalc(){
	//Exports all results to csv - doesn't take filters into account
	//If people complain, I will make it take the filters into account

	if(fightResults.length>0){
		var csvString = "data:text/csv;charset=utf-8,";

		//Column headers
		//Should take out buffs and stuff that aren't used to minimize columns?
		csvString += "Challenger,cColor,cMovetype,cWeapontype,cRarity,cMerge,cBoon,cBane,cMaxHP,cStartHP,cAtk,cSpd,cDef,cRes,cWeapon,cRefine,cAssist,cSpecial,cPrecharge,cAdjacent,cA,cB,cC,cS,cBuffAtk,cBuffSpd,cBuffDef,cBuffRes,cDebuffAtk,cDebuffSpd,cDebuffDef,cDebuffRes,cSpurAtk,cSpurSpd,cSpurDef,cSpurRes,";
		csvString += "Enemy,eColor,eMovetype,eWeapontype,eRarity,eMerge,eBoon,eBane,eMaxHP,eStartHP,eAtk,eSpd,eDef,eRes,eWeapon,eRefine,eAssist,eSpecial,ePrecharge,eAdjacent,eA,eB,eC,eS,eBuffAtk,eBuffSpd,eBuffDef,eBuffRes,eDebuffAtk,eDebuffSpd,eDebuffDef,eDebuffRes,eSpurAtk,eSpurSpd,eSpurDef,eSpurRes,";
		csvString += "InitialThreatenChallenger,InitialThreatenEnemy,buffStartTurn,debuffStartTurn,GaleforceChallenger,GaleforceEnemy,Initiator1,Initiator2,Initiator3,Initiator4,Outcome,cEndHP,eEndHP,Rounds,Overkill,BattleLog\n";

		fightResults.forEach(function(result){
			csvString += data.heroes[challenger.index].name + ",";
			csvString += data.heroes[challenger.index].color + ",";
			csvString += data.heroes[challenger.index].movetype + ",";
			csvString += data.heroes[challenger.index].weapontype + ",";
			csvString += challenger.rarity + ",";
			csvString += challenger.merge + ",";
			csvString += challenger.boon + ",";
			csvString += challenger.bane + ",";
			csvString += challenger.hp + ",";
			csvString += Math.max(challenger.hp - challenger.damage,1) + ",";
			csvString += challenger.atk + ",";
			csvString += challenger.spd + ",";
			csvString += challenger.def + ",";
			csvString += challenger.res + ",";
			if(challenger.weapon != -1){
				csvString += data.skills[challenger.weapon].name + ",";
			}
			else{
				csvString += ",";
			}
			if(challenger.refine != -1){
				csvString += data.refine[challenger.refine].name + ",";
			}
			else{
				csvString += ",";
			}
			if(challenger.assist != -1){
				csvString += data.skills[challenger.assist].name + ",";
			}
			else{
				csvString += ",";
			}
			if(challenger.special != -1){
				csvString += data.skills[challenger.special].name + ",";
			}
			else{
				csvString += ",";
			}
			csvString += challenger.precharge + ",";
			csvString += challenger.adjacent + ",";
			if(challenger.a != -1){
				csvString += data.skills[challenger.a].name + ",";
			}
			else{
				csvString += ",";
			}
			if(challenger.b != -1){
				csvString += data.skills[challenger.b].name + ",";
			}
			else{
				csvString += ",";
			}
			if(challenger.c != -1){
				csvString += data.skills[challenger.c].name + ",";
			}
			else{
				csvString += ",";
			}
			if(challenger.s != -1){
				csvString += data.skills[challenger.s].name + ",";
			}
			else{
				csvString += ",";
			}
			csvString += challenger.buffs.atk + ",";
			csvString += challenger.buffs.spd + ",";
			csvString += challenger.buffs.def + ",";
			csvString += challenger.buffs.res + ",";
			csvString += challenger.debuffs.atk + ",";
			csvString += challenger.debuffs.spd + ",";
			csvString += challenger.debuffs.def + ",";
			csvString += challenger.debuffs.res + ",";
			csvString += challenger.spur.atk + ",";
			csvString += challenger.spur.spd + ",";
			csvString += challenger.spur.def + ",";
			csvString += challenger.spur.res + ",";

			var enemy = result.enemy;
			csvString += enemy.name + ",";
			csvString += enemy.color + ",";
			csvString += enemy.moveType + ",";
			csvString += enemy.weaponType + ",";
			csvString += enemy.rarity + ",";
			csvString += enemy.merge + ",";
			csvString += enemy.boon + ",";
			csvString += enemy.bane + ",";
			csvString += enemy.maxHp + ",";
			csvString += Math.max(enemy.maxHp - enemy.damage,1) + ",";
			csvString += enemy.atk + ",";
			csvString += enemy.spd + ",";
			csvString += enemy.def + ",";
			csvString += enemy.res + ",";
			if(enemy.weaponIndex != -1){
				csvString += data.skills[enemy.weaponIndex].name + ",";
			}
			else{
				csvString += ",";
			}
			if(enemy.refineIndex != -1){
				csvString += data.skills[enemy.refineIndex].name + ",";
			}
			else{
				csvString += ",";
			}
			if(enemy.assistIndex != -1){
				csvString += data.skills[enemy.assistIndex].name + ",";
			}
			else{
				csvString += ",";
			}
			if(enemy.specialIndex != -1){
				csvString += data.skills[enemy.specialIndex].name + ",";
			}
			else{
				csvString += ",";
			}
			csvString += enemies.fl.precharge + ",";
			csvString += enemies.fl.adjacent + ",";
			if(enemy.aIndex != -1){
				csvString += data.skills[enemy.aIndex].name + ",";
			}
			else{
				csvString += ",";
			}
			if(enemy.bIndex != -1){
				csvString += data.skills[enemy.bIndex].name + ",";
			}
			else{
				csvString += ",";
			}
			if(enemy.cIndex != -1){
				csvString += data.skills[enemy.cIndex].name + ",";
			}
			else{
				csvString += ",";
			}
			if(enemy.sIndex != -1){
				csvString += data.skills[enemy.sIndex].name + ",";
			}
			else{
				csvString += ",";
			}
			csvString += enemy.buffs.atk + ",";
			csvString += enemy.buffs.spd + ",";
			csvString += enemy.buffs.def + ",";
			csvString += enemy.buffs.res + ",";
			csvString += enemy.debuffs.atk + ",";
			csvString += enemy.debuffs.spd + ",";
			csvString += enemy.debuffs.def + ",";
			csvString += enemy.debuffs.res + ",";
			csvString += enemy.spur.atk + ",";
			csvString += enemy.spur.spd + ",";
			csvString += enemy.spur.def + ",";
			csvString += enemy.spur.res + ",";

			csvString += options.threaten_challenger + ",";
			csvString += options.threaten_enemy + ",";
			csvString += options.buffstartTurn + ",";
			csvString += options.debuffstartTurn + ",";
			csvString += options.galeforce_challenger + ",";
			csvString += options.galeforce_enemy + ",";
			csvString += options.sweep_challenger + ",";
			csvString += options.sweep_enemy + ",";
			for(var rnd = 0; rnd < 4;rnd++){
				if(!!options.roundInitiators[rnd]){
					csvString += options.roundInitiators[rnd].substring(0,options.roundInitiators[rnd].length-10) + ",";
				}
				else{
					csvString += ",";
				}
			}
			var outcome = "Inconclusive";
			var overkill = 0;
			if(result.challenger.hp==0){
				outcome = "Loss";
				overkill = result.challenger.overkill;
			}
			else if(result.enemy.hp==0){
				outcome = "Win";
				overkill = result.enemy.overkill;
			}
			csvString += outcome + ",";
			csvString += result.challenger.hp + ",";
			csvString += result.enemy.hp + ",";
			csvString += result.rounds + ",";
			csvString += overkill + ",";
			var deTaggedLog = result.fightText.replace(/<br\/?>/g, "; ");
			deTaggedLog = deTaggedLog.replace(/<\/?[^>]+(>|$)/g, "");
			csvString += "\"" + deTaggedLog + "\"";

			csvString += "\n";
		});

		var encodedUri = encodeURI(csvString);
		var fakeLink = document.createElement("a");
		fakeLink.setAttribute("href", encodedUri);
		var date = new Date();
		fakeLink.setAttribute("download", "feh_simulator_" + (date.getYear()+1900) + "-" + (date.getMonth()+1) + "-" + date.getDate() + "_" + data.heroes[challenger.index].name + ".csv");
		document.body.appendChild(fakeLink);
		fakeLink.click();
	}
	else{
		alert("No results!");
	}
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

//Statistics

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

function resetStatistics(){
	statistics.challenger.res_hp_max = -1;
	statistics.challenger.res_hp_min = -1;
	statistics.challenger.res_hp_avg = -1;
	statistics.enemies.res_hp_max = -1;
	statistics.enemies.res_hp_min = -1;
	statistics.enemies.res_hp_avg = -1;
	statistics.enemies.list = [];
	statistics.enemies.red = 0;
	statistics.enemies.red_outcome = [0,0,0];
	statistics.enemies.blue = 0;
	statistics.enemies.blue_outcome = [0,0,0];
	statistics.enemies.green = 0;
	statistics.enemies.green_outcome = [0,0,0];
	statistics.enemies.gray = 0;
	statistics.enemies.gray_outcome = [0,0,0];
	statistics.enemies.infantry = 0;
	statistics.enemies.infantry_outcome = [0,0,0];
	statistics.enemies.armored = 0;
	statistics.enemies.armored_outcome = [0,0,0];
	statistics.enemies.flying = 0;
	statistics.enemies.flying_outcome = [0,0,0];
	statistics.enemies.cavalry = 0;
	statistics.enemies.cavalry_outcome = [0,0,0];
	statistics.enemies.melee = 0;
	statistics.enemies.melee_outcome = [0,0,0];
	statistics.enemies.ranged = 0;
    statistics.enemies.ranged_outcome = [0,0,0];

    // OUTCOME ORIENTED
    let keys = ['wins', 'losses', 'inconclusives_challenger', 'inconclusives_enemy'];
    keys.map(key => statistics[key]).forEach(stat => {
        stat.min = Number.MAX_SAFE_INTEGER;
        stat.max = -Number.MAX_SAFE_INTEGER;
        stat.average = 0;
        stat.count = 0;
    });
    // OUTCOME ORIENTED END
}

function collectStatistics(challenger, enemy, outcome){

    // OUTCOME ORIENTED
    let key_hp_pair = [];
    switch (outcome) {
        case 'win':
            key_hp_pair.push(['wins', challenger.hp]);
            break;
        case 'loss':
            key_hp_pair.push(['losses', enemy.hp]);
            break;
        default:
            key_hp_pair.push(['inconclusives_challenger', challenger.hp]);
            key_hp_pair.push(['inconclusives_enemy', enemy.hp]);
            break;
    }
    key_hp_pair.forEach(pair => {
        let key = pair[0];
        let hp = pair[1];
        let stat = statistics[key];
        stat.min = Math.min(stat.min, hp);
        stat.max = Math.max(stat.max, hp);
        stat.average += hp;
        stat.count++;
    })
    // OUTCOME ORIENTED END

	//Challenger
	if (statistics.challenger.res_hp_max == -1){
		statistics.challenger.res_hp_max = challenger.hp;
	}else if (statistics.challenger.res_hp_max < challenger.hp){
		statistics.challenger.res_hp_max = challenger.hp;
	}
	if (statistics.challenger.res_hp_min == -1){
		statistics.challenger.res_hp_min = challenger.hp;
	}else if (statistics.challenger.res_hp_min > challenger.hp){
		statistics.challenger.res_hp_min = challenger.hp;
	}
	if (statistics.challenger.res_hp_avg == -1){
		statistics.challenger.res_hp_avg = challenger.hp;
	}else{
		statistics.challenger.res_hp_avg += challenger.hp;
	}

	//Enemies
	if (statistics.enemies.res_hp_max == -1){
		statistics.enemies.res_hp_max = enemy.hp;
	}else if (statistics.enemies.res_hp_max < enemy.hp){
		statistics.enemies.res_hp_max = enemy.hp;
	}
	if (statistics.enemies.res_hp_min == -1){
		statistics.enemies.res_hp_min = enemy.hp;
	}else if (statistics.enemies.res_hp_min > enemy.hp){
		statistics.enemies.res_hp_min = enemy.hp;
	}
	if (statistics.enemies.res_hp_avg == -1){
		statistics.enemies.res_hp_avg = enemy.hp;
	}else{
		statistics.enemies.res_hp_avg += enemy.hp;
	}
	//Outcome [win, loss, inconclusive]
	//Tally Color
	if (enemy.color == "red"){
		statistics.enemies.red++;
		if (outcome == "win"){ statistics.enemies.red_outcome[0]++; }
		else if (outcome == "loss"){ statistics.enemies.red_outcome[1]++; }
		else if (outcome == "inconclusive"){ statistics.enemies.red_outcome[2]++; }
	}else if (enemy.color == "blue"){
		statistics.enemies.blue++;
		if (outcome == "win"){ statistics.enemies.blue_outcome[0]++; }
		else if (outcome == "loss"){ statistics.enemies.blue_outcome[1]++; }
		else if (outcome == "inconclusive"){ statistics.enemies.blue_outcome[2]++; }
	}else if (enemy.color == "green"){
		statistics.enemies.green++;
		if (outcome == "win"){ statistics.enemies.green_outcome[0]++; }
		else if (outcome == "loss"){ statistics.enemies.green_outcome[1]++; }
		else if (outcome == "inconclusive"){ statistics.enemies.green_outcome[2]++; }
	}else{
		statistics.enemies.gray++;
		if (outcome == "win"){ statistics.enemies.gray_outcome[0]++; }
		else if (outcome == "loss"){ statistics.enemies.gray_outcome[1]++; }
		else if (outcome == "inconclusive"){ statistics.enemies.gray_outcome[2]++; }
	}
	//Tally Range
	if (enemy.range == "melee"){
		statistics.enemies.melee++;
		if (outcome == "win"){ statistics.enemies.melee_outcome[0]++; }
		else if (outcome == "loss"){ statistics.enemies.melee_outcome[1]++; }
		else if (outcome == "inconclusive"){ statistics.enemies.melee_outcome[2]++; }
	}else{
		statistics.enemies.ranged++;
		if (outcome == "win"){ statistics.enemies.ranged_outcome[0]++; }
		else if (outcome == "loss"){ statistics.enemies.ranged_outcome[1]++; }
		else if (outcome == "inconclusive"){ statistics.enemies.ranged_outcome[2]++; }
	}
	//Tally Type
	if (enemy.moveType == "infantry"){
		statistics.enemies.infantry++;
		if (outcome == "win"){ statistics.enemies.infantry_outcome[0]++; }
		else if (outcome == "loss"){ statistics.enemies.infantry_outcome[1]++; }
		else if (outcome == "inconclusive"){ statistics.enemies.infantry_outcome[2]++; }
	}else if (enemy.moveType == "armored"){
		statistics.enemies.armored++;
		if (outcome == "win"){ statistics.enemies.armored_outcome[0]++; }
		else if (outcome == "loss"){ statistics.enemies.armored_outcome[1]++; }
		else if (outcome == "inconclusive"){ statistics.enemies.armored_outcome[2]++; }
	}else if (enemy.moveType == "flying"){
		statistics.enemies.flying++;
		if (outcome == "win"){ statistics.enemies.flying_outcome[0]++; }
		else if (outcome == "loss"){ statistics.enemies.flying_outcome[1]++; }
		else if (outcome == "inconclusive"){ statistics.enemies.flying_outcome[2]++; }
	}else if (enemy.moveType == "cavalry"){
		statistics.enemies.cavalry++;
		if (outcome == "win"){ statistics.enemies.cavalry_outcome[0]++; }
		else if (outcome == "loss"){ statistics.enemies.cavalry_outcome[1]++; }
		else if (outcome == "inconclusive"){ statistics.enemies.cavalry_outcome[2]++; }
	}
}

function calculateStatistics(){
	//console.log(statistics.enemies.list);
	statistics.challenger.res_hp_avg = Math.round(statistics.challenger.res_hp_avg / statistics.enemies.list.length);
    statistics.enemies.res_hp_avg = Math.round(statistics.enemies.res_hp_avg / statistics.enemies.list.length);

    // OUTCOME ORIENTED
    let keys = ['wins', 'losses', 'inconclusives_challenger', 'inconclusives_enemy'];
    keys.map(key => statistics[key]).forEach(stat => {
        if (stat.min == Number.MAX_SAFE_INTEGER) stat.min = '-';
        if (stat.max == -Number.MAX_SAFE_INTEGER) stat.max = '-';
        if (stat.count == 0) stat.average = '-';
        else stat.average = Math.round(stat.average / stat.count);
    });
    // OUTCOME ORIENTED END
}

function updateStatisticsUI(){
	//Do calculations first
	calculateStatistics();

	//Update UI
	$("#challenger_res_hp_max").html(statistics.challenger.res_hp_max);
	$("#challenger_res_hp_min").html(statistics.challenger.res_hp_min);
	$("#challenger_res_hp_avg").html(statistics.challenger.res_hp_avg);

	$("#enemies_res_hp_max").html(statistics.enemies.res_hp_max);
	$("#enemies_res_hp_min").html(statistics.enemies.res_hp_min);
    $("#enemies_res_hp_avg").html(statistics.enemies.res_hp_avg);

    // OUTCOME ORIENTED
    $("#wins_res_hp_max").html(statistics.wins.max);
    $("#wins_res_hp_min").html(statistics.wins.min);
    $("#wins_res_hp_avg").html(statistics.wins.average);

    $("#losses_res_hp_max").html(statistics.losses.max);
    $("#losses_res_hp_min").html(statistics.losses.min);
    $("#losses_res_hp_avg").html(statistics.losses.average);

    $("#inconclusives_challenger_res_hp_max").html(statistics.inconclusives_challenger.max);
    $("#inconclusives_challenger_res_hp_min").html(statistics.inconclusives_challenger.min);
    $("#inconclusives_challenger_res_hp_avg").html(statistics.inconclusives_challenger.average);

    $("#inconclusives_enemy_res_hp_max").html(statistics.inconclusives_enemy.max);
    $("#inconclusives_enemy_res_hp_min").html(statistics.inconclusives_enemy.min);
    $("#inconclusives_enemy_res_hp_avg").html(statistics.inconclusives_enemy.average);

    $("#wins_res_count").html(statistics.wins.count);
    $("#losses_res_count").html(statistics.losses.count);
    $("#inconclusive_res_count").html(statistics.inconclusives_enemy.count + statistics.inconclusives_challenger.count);
    // OUTCOME ORIENTED END

	//Draw Chart
	drawChart();
}

function drawChart() {
	var data;
	var option;
	var chart;

	switch (options.chartType){
		case "enemies by color":
			//Data
			data = google.visualization.arrayToDataTable([
				['Color',	'# of Heroes'],
				['Red',		statistics.enemies.red],
				['Blue',	statistics.enemies.blue],
				['Green',	statistics.enemies.green],
				['Gray',	statistics.enemies.gray]
			]);
			//Options
			option = {
				backgroundColor: 'transparent',
				width: 200,
				legend: {
					position: 'top',
					textStyle: {color: 'white', fontSize: 10},
					maxLines: 2
				},
				slices: {
					0: { color: '#cd6155' },
					1: { color: '#5dade2' },
					2: { color: '#58d68d' },
					3: { color: '#99a3a4' }
				},
				pieSliceText: 'value'
			};
			//Chart Type
			chart = new google.visualization.PieChart(document.getElementById('stat_chart'));
			break;
		case "enemies by range":
			//Data
			data = google.visualization.arrayToDataTable([
				['Range',	'# of Heroes'],
				['Melee',	statistics.enemies.melee],
				['Ranged',	statistics.enemies.ranged]
			]);
			//Options
			option = {
				backgroundColor: 'transparent',
				width: 200,
				legend: {
					position: 'top',
					textStyle: {color: 'white', fontSize: 10},
					maxLines: 2
				},
				slices: {
					0: { color: 'ca925b' },
					1: { color: 'a1c4d0' },
				},
				pieSliceText: 'value'
			};
			//Chart Type
			chart = new google.visualization.PieChart(document.getElementById('stat_chart'));
			break;
		case "enemies by movement":
			//Data
			data = google.visualization.arrayToDataTable([
				['Movement',	'# of Heroes'],
				['Infantry',	statistics.enemies.infantry],
				['Armored',		statistics.enemies.armored],
				['Flying',		statistics.enemies.flying],
				['Cavalry',		statistics.enemies.cavalry]
			]);
			//Options
			option = {
				backgroundColor: 'transparent',
				width: 200,
				legend: {
					position: 'top',
					textStyle: {color: 'white', fontSize: 10},
					maxLines: 2
				},
				slices: {
					0: { color: 'b4b7b8' },
					1: { color: '9e87cb' },
					2: { color: '60c2ce' },
					3: { color: 'db8f3f' }
				},
				pieSliceText: 'value'
			};
			//Chart Type
			chart = new google.visualization.PieChart(document.getElementById('stat_chart'));
			break;
		case "outcomes by color":
			//Data
			data = google.visualization.arrayToDataTable([
				['Color', 'Win', 'Inconclusive', 'Loss', { role: 'annotation' } ],
				['Red', statistics.enemies.red_outcome[0], statistics.enemies.red_outcome[2], statistics.enemies.red_outcome[1], ""],
				['Blue', statistics.enemies.blue_outcome[0], statistics.enemies.blue_outcome[2], statistics.enemies.blue_outcome[1], ""],
				['Green', statistics.enemies.green_outcome[0], statistics.enemies.green_outcome[2], statistics.enemies.green_outcome[1], ""],
				['Gray', statistics.enemies.gray_outcome[0], statistics.enemies.gray_outcome[2], statistics.enemies.gray_outcome[1], ""]
			]);
			//Options
			option = {
				backgroundColor: 'transparent',
				width: 200,
				legend: 'none',
				hAxis: {
					textStyle: {color: 'white', fontSize: 8}
				},
				vAxis: {
					minValue: 0,
					ticks: [0, .25, .5, .75, 1],
					textStyle: {color: 'white', fontSize: 8}
				},
				bar: { groupWidth: '75%' },
				colors: ['7797ff', 'cccccc', 'ff5165'],
				isStacked: 'percent'
			};
			//Chart Type
			chart = new google.visualization.ColumnChart(document.getElementById('stat_chart'));
			break;
		case "outcomes by range":
			//Data
			data = google.visualization.arrayToDataTable([
				['Range', 'Win', 'Inconclusive', 'Loss', { role: 'annotation' } ],
				['Melee', statistics.enemies.melee_outcome[0], statistics.enemies.melee_outcome[2], statistics.enemies.melee_outcome[1], ""],
				['Ranged', statistics.enemies.ranged_outcome[0], statistics.enemies.ranged_outcome[2], statistics.enemies.ranged_outcome[1], ""]
			]);
			//Options
			option = {
				backgroundColor: 'transparent',
				width: 200,
				legend: 'none',
				hAxis: {
					textStyle: {color: 'white', fontSize: 8}
				},
				vAxis: {
					minValue: 0,
					ticks: [0, .25, .5, .75, 1],
					textStyle: {color: 'white', fontSize: 8}
				},
				bar: { groupWidth: '75%' },
				colors: ['7797ff', 'cccccc', 'ff5165'],
				isStacked: 'percent'
			};
			//Chart Type
			chart = new google.visualization.ColumnChart(document.getElementById('stat_chart'));
			break;
		case "outcomes by movement":
			//Data
			data = google.visualization.arrayToDataTable([
				['Color', 'Win', 'Inconclusive', 'Loss', { role: 'annotation' } ],
				['Infantry', statistics.enemies.infantry_outcome[0], statistics.enemies.infantry_outcome[2], statistics.enemies.infantry_outcome[1], ""],
				['Armored', statistics.enemies.armored_outcome[0], statistics.enemies.armored_outcome[2], statistics.enemies.armored_outcome[1], ""],
				['Flying', statistics.enemies.flying_outcome[0], statistics.enemies.flying_outcome[2], statistics.enemies.flying_outcome[1], ""],
				['Cavalry', statistics.enemies.cavalry_outcome[0], statistics.enemies.cavalry_outcome[2], statistics.enemies.cavalry_outcome[1], ""]
			]);
			//Options
			option = {
				backgroundColor: 'transparent',
				width: 200,
				legend: 'none',
				hAxis: {
					textStyle: {color: 'white', fontSize: 8}
				},
				vAxis: {
					minValue: 0,
					ticks: [0, .25, .5, .75, 1],
					textStyle: {color: 'white', fontSize: 8}
				},
				bar: { groupWidth: '75%' },
				colors: ['7797ff', 'cccccc', 'ff5165'],
				isStacked: 'percent'
			};
			//Chart Type
			chart = new google.visualization.ColumnChart(document.getElementById('stat_chart'));
			break;
		default:
			console.log("Invalid chart type.");
	}

	//Draw chart
	chart.draw(data, option);
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

//activeHero

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

//activeHero is a class for simulating a unit in a battle
//This is where most of the calculations happen
//heroIndex is the index of the hero represented
//challenger is true if challenger, false if enemy

//Variable for keeping track of attacker for Urvan and similar skills
//***Currently does not include aoe damage in consecutive damage check, revise if required***
var lastAttacker = "none";

function activeHero(hero){

	//Note a difference between the combatBuffs used here and the 'combat buffs' on the wiki,
	//combatBuffs here is only used for defiant skills, which are considered as field buffs
	//Whereas combatSpurs are the 'combat buffs', which do not affect harsh command and bladetomes
	this.combatBuffs = {"atk":0,"spd":0,"def":0,"res":0};
	this.combatDebuffs = {"atk":0,"spd":0,"def":0,"res":0};
	this.combatSpur = {"atk":0,"spd":0,"def":0,"res":0};
	this.combatStat = {"atk":0,"spd":0,"def":0,"res":0};

	this.skillNames = [];

	this.challenger = !!hero.challenger; //Will be undefined if not challenger
	this.heroIndex = hero.index;
	this.realName = data.heroes[this.heroIndex].name;
	this.name = (this.challenger ? "<span class=\"lightblue\">" + this.realName + "</span>" : "<span class=\"pink\">" + this.realName + "</span>");
	this.rarity = hero.rarity;
	this.merge = hero.merge;

	this.weaponIndex = hero.weapon;
	this.refineIndex = hero.refine;
	this.assistIndex = hero.assist;
	this.specialIndex = hero.special;
	this.aIndex = hero.a;
	this.bIndex = hero.b;
	this.cIndex = hero.c;
	this.sIndex = hero.s;

	this.boon = hero.boon;
	this.bane = hero.bane;
	this.summoner = hero.summoner;
	this.ally = hero.ally;
	this.bless_1 = hero.bless_1;
	this.bless_2 = hero.bless_2;
	this.bless_3 = hero.bless_3;
	this.damage = hero.damage;

	this.buffs = hero.buffs;
	this.debuffs = hero.debuffs;
	this.spur = hero.spur;

	//Charged damage to be released during combat, resets at end of combat
	this.chargedDamage = 0;
	//Triggered is true if a special activates
	this.triggered = false;

	this.statOffset = {"hp":0,"atk":0,"spd":0,"def":0,"res":0};
	this.maxHp = hero.hp;
	this.atk = hero.atk;
	this.spd = hero.spd;
	this.def = hero.def;
	this.res = hero.res;

	this.moveType = data.heroes[this.heroIndex].movetype;
	this.weaponType = data.heroes[this.heroIndex].weapontype;
	this.color = data.heroes[this.heroIndex].color;

	this.hp = Math.max(this.maxHp - hero.damage,1);
	this.precharge = hero.precharge;
	this.adjacent = hero.adjacent;
	this.adjacent2 = hero.adjacent2;
	this.adjacent_foe = hero.adjacent_foe;
	this.adjacent2_foe = hero.adjacent2_foe;

	//Make a list of skill names for easy reference
	if(this.weaponIndex != -1){
		this.skillNames.push(data.skills[this.weaponIndex].name);
	}
	if(this.refineIndex != -1){
		this.skillNames.push(data.refine[this.refineIndex].name);
	}
	if(this.assistIndex != -1){
		this.skillNames.push(data.skills[this.assistIndex].name);
	}
	if(this.specialIndex != -1){
		this.skillNames.push(data.skills[this.specialIndex].name);
	}
	if(this.aIndex != -1){
		this.skillNames.push(data.skills[this.aIndex].name);
	}
	if(this.bIndex != -1){
		this.skillNames.push(data.skills[this.bIndex].name);
	}
	if(this.cIndex != -1){
		this.skillNames.push(data.skills[this.cIndex].name);
	}
	if(this.sIndex != -1){
		this.skillNames.push(data.skills[this.sIndex].name);
	}

	//Categorize weapon
	if(data.rangedWeapons.indexOf(this.weaponType)!=-1){
		this.range = "ranged";
	}
	else{
		this.range = "melee";
	}
	if(data.physicalWeapons.indexOf(this.weaponType)!=-1){
		this.attackType = "physical";
	}
	else{
		this.attackType = "magical";
	}

	this.charge = 0;
	this.initiator = false;
	this.lit = false;
	this.triangled = false;
	this.bewitched = false;
	this.panicked = false;
	this.rushed = false;
	this.flashed = false;
	this.pulsed = this.challenger ? options.pulse_challenger : options.pulse_enemy;
	this.harshed = false;
	this.close_defed = false;
	this.distant_defed = false;
	this.moveBuffed = false;
	this.didAttack = false;

	this.has = function(skill){
		//finds if hero has a skill that includes the string given
		//returns 1 if found, or a number 1-3 if level of skill is found
		//For exact matches, see "hasExactly"
		var index = -1;

		for(var i = 0; i < this.skillNames.length; i++){
			if(this.skillNames[i].indexOf(skill) != -1){
				index = i;
			}
		}

		if(index != -1){
			if($.isNumeric(this.skillNames[index].charAt(this.skillNames[index].length-1))){
				return parseInt(this.skillNames[index].charAt(this.skillNames[index].length-1));
			}
			else{
				return 1;
			}
		}
		else{
			return 0;
		}
	}

	this.hasExactly = function(skill){
		//finds if hero has a skill with an exact name
		//returns true if found
		for(var i = 0; i < this.skillNames.length; i++){
			if(this.skillNames[i] == skill){
				return true;
			}
		}
		return false;
	}

	//Checks if skill name matches skill index and returns skill tier
	//eg. this.hasAtIndex("Skill Name", this.aIndex)
	this.hasAtIndex = function(skill, index){
		if(index != -1){
			var skillName = data.skills[index].name;
			//If skill ends with a number, compare skill without the number
			if($.isNumeric(skillName.charAt(skillName.length - 1))){
				if (skillName.substring(0, skillName.length - 2) == skill){
					return parseInt(skillName.charAt(skillName.length - 1));
				} else{
					return 0;
				}
			}
			//Else just check if skill matches
			else{
				return (skillName == skill ? 1 : 0);
			}
		} else{
			return 0;
		}
	}

	//Checks if skill name matches skill index exactly and returns boolean
	//eg. this.hasExactlyAtIndex("Skill Name 3", this.cIndex)
	this.hasExactlyAtIndex = function(skill, index){
		if(index != -1){
			if (data.skills[index].name == skill){
				return true;
			} else{
				return false;
			}
		} else{
			return false;
		}
	}

	//Checks if refine name matches refine index exactly and returns boolean
	//eg. this.hasAtRefineIndex("Refine Option", this.refineIndex)
	this.hasAtRefineIndex = function(skill, index){
		if(index != -1){
			if (data.refine[index].name == skill){
				return true;
			} else{
				return false;
			}
		} else{
			return false;
		}
	}

	//Calculate current special charge held
	//***This is separate from the UI update that is done to show correct UI values***
	this.resetCharge = function(){
		//Reset charge based on weapon
		//For weapons that would reduce charge, you gain a charge instead, and vice versa
		//***Important: Append a slot whenever a new slot gains a skill that affects CD***
		this.charge = 0;
		this.charge += -1 * getCDChange(data.skills[this.weaponIndex], "weapon");
		this.charge += -1 * getCDChange(data.refine[this.refineIndex], "refine");
		this.charge += -1 * getCDChange(data.skills[this.assistIndex], "assist");
		this.charge += -1 * getCDChange(data.skills[this.bIndex], "b");
	}
	//TODO: Combine this with precharge from UI change
	this.resetPrecharge = function(){
		//***Precharge is confusing here: Why is it added into charge first then added again from skills?***
		if(this.hasAtRefineIndex("Quickened Pulse", this.refineIndex)){
			this.precharge += 2;
		}
		if(this.hasAtIndex("Quickened Pulse",this.sIndex)){
			this.precharge++;
		}
		if(this.has("S Drink")){
			this.precharge++;
		}
		//Shield Pulse charge at beginning
		if (getSpecialType(data.skills[this.specialIndex]) == "defensive"){
			if(this.has("Shield Pulse 3")){
				this.precharge += 2;
			} else if(this.has("Shield Pulse 1") || this.has("Shield Pulse 2")){
				this.precharge++;
			}
		}
		//Other Pulse skills
		if (this.pulsed){
			this.precharge++;
		}
	}

	//Set charge at beginning
	this.resetCharge();
	this.resetPrecharge();
	this.charge += this.precharge;

	this.threaten = function(enemy){
		//Thhhhhhhhrreats!
		var threatenText = "";
		var skillName = "";
		var threatDebuffs = {"atk":0,"spd":0,"def":0,"res":0};
		var skillNames = [];

		//Only do ploys if not facing ranged diagonally-oriented asshats
		//Ploys debuff do not stack with other debuff
		if(enemy.range == "melee" || options.ployBehavior != "Diagonal"){
			if(this.res > enemy.res){
				//Weapon
				if (this.hasExactly("Valflame")){
					threatDebuffs.atk = Math.min(threatDebuffs.atk, -4);
					threatDebuffs.res = Math.min(threatDebuffs.res, -4);
					skillNames.push(data.skills[this.weaponIndex].name);
				}
				if (this.hasExactly("Wargod's Tome")){
					threatDebuffs.atk = Math.min(threatDebuffs.atk, -4);
					threatDebuffs.res = Math.min(threatDebuffs.res, -4);
					skillNames.push(data.skills[this.weaponIndex].name);
				}
				if (this.hasExactly("Weirding Tome")){
					threatDebuffs.spd = Math.min(threatDebuffs.spd, -5);
					skillNames.push(data.skills[this.weaponIndex].name);
				}
				if (this.hasExactly("Reese's Ploy")){
					threatDebuffs.spd = Math.min(threatDebuffs.spd, -4);
					threatDebuffs.res = Math.min(threatDebuffs.res, -4);
					skillNames.push("Reese's Ploy");
				}
				//Passive C Skills
				if(this.hasAtIndex("Atk Ploy", this.cIndex)){
					threatDebuffs.atk = Math.min(threatDebuffs.atk,-this.hasAtIndex("Atk Ploy", this.cIndex)-2);
					skillNames.push(data.skills[this.cIndex].name);
				}
				if(this.hasAtIndex("Spd Ploy", this.cIndex)){
					threatDebuffs.spd = Math.min(threatDebuffs.spd,-this.hasAtIndex("Spd Ploy", this.cIndex)-2);
					skillNames.push(data.skills[this.cIndex].name);
				}
				if(this.hasAtIndex("Def Ploy", this.cIndex)){
					threatDebuffs.def = Math.min(threatDebuffs.def,-this.hasAtIndex("Def Ploy", this.cIndex)-2);
					skillNames.push(data.skills[this.cIndex].name);
				}
				if(this.hasAtIndex("Res Ploy", this.cIndex)){
					threatDebuffs.res = Math.min(threatDebuffs.res,-this.hasAtIndex("Res Ploy", this.cIndex)-2);
					skillNames.push(data.skills[this.cIndex].name);
				}
				//Seals
				if(this.hasAtIndex("Atk Ploy", this.sIndex)){
					threatDebuffs.atk = Math.min(threatDebuffs.atk,-this.hasAtIndex("Atk Ploy", this.sIndex)-2);
					skillNames.push(data.skills[this.sIndex].name + " (Seal)");
				}
				if(this.hasAtIndex("Spd Ploy", this.sIndex)){
					threatDebuffs.spd = Math.min(threatDebuffs.spd,-this.hasAtIndex("Spd Ploy", this.sIndex)-2);
					skillNames.push(data.skills[this.sIndex].name + " (Seal)");
				}
				if(this.hasAtIndex("Def Ploy", this.sIndex)){
					threatDebuffs.def = Math.min(threatDebuffs.def,-this.hasAtIndex("Def Ploy", this.sIndex)-2);
					skillNames.push(data.skills[this.sIndex].name + " (Seal)");
				}
				if(this.hasAtIndex("Res Ploy", this.sIndex)){
					threatDebuffs.res = Math.min(threatDebuffs.res,-this.hasAtIndex("Res Ploy", this.sIndex)-2);
					skillNames.push(data.skills[this.sIndex].name + " (Seal)");
				}
			}
			//Panic Ploy
			if(this.hasAtIndex("Panic Ploy", this.cIndex) && this.hp > enemy.hp + 6 - this.hasAtIndex("Panic Ploy", this.cIndex) * 2){
				enemy.panicked = true;
				threatenText += this.name + " activates " + data.skills[this.cIndex].name + ", inflicting panic on " + enemy.name + ".<br>";
			}
			//Panic Ploy Seal
			if(this.hasAtIndex("Panic Ploy", this.sIndex) && this.hp > enemy.hp + 6 - this.hasAtIndex("Panic Ploy", this.sIndex) * 2){
				enemy.panicked = true;
				threatenText += this.name + " activates " + data.skills[this.sIndex].name + " (Seal), inflicting panic on " + enemy.name + ".<br>";
			}
			//Panic Ploy Refinement
			if(this.hasAtRefineIndex("Panic Ploy", this.refineIndex) && this.hp > enemy.hp){
				enemy.panicked = true;
				threatenText += this.name + " activates " + data.skills[this.weaponIndex].name + " (Refined), inflicting panic on " + enemy.name + ".<br>";
			}
		}

		//Skills
		if(this.hasAtIndex("Threaten Atk", this.cIndex)){
			threatDebuffs.atk = Math.min(threatDebuffs.atk,-this.hasAtIndex("Threaten Atk", this.cIndex)-2);
			skillNames.push(data.skills[this.cIndex].name);
		}
		if(this.hasAtIndex("Threaten Atk", this.sIndex)){
			threatDebuffs.atk = Math.min(threatDebuffs.atk,-this.hasAtIndex("Threaten Atk", this.sIndex)-2);
			skillNames.push(data.skills[this.sIndex].name + " (Seal)");
		}
		if(this.hasAtIndex("Threaten Spd", this.cIndex)){
			threatDebuffs.spd = Math.min(threatDebuffs.spd,-this.hasAtIndex("Threaten Spd", this.cIndex)-2);
			skillNames.push(data.skills[this.cIndex].name);
		}
		if(this.hasAtIndex("Threaten Spd", this.sIndex)){
			threatDebuffs.spd = Math.min(threatDebuffs.spd,-this.hasAtIndex("Threaten Spd", this.sIndex)-2);
			skillNames.push(data.skills[this.sIndex].name + " (Seal)");
		}
		if(this.hasAtIndex("Threaten Def", this.cIndex)){
			threatDebuffs.def = Math.min(threatDebuffs.def,-this.hasAtIndex("Threaten Def", this.cIndex)-2);
			skillNames.push(data.skills[this.cIndex].name);
		}
		if(this.hasAtIndex("Threaten Def", this.sIndex)){
			threatDebuffs.def = Math.min(threatDebuffs.def,-this.hasAtIndex("Threaten Def", this.sIndex)-2);
			skillNames.push(data.skills[this.sIndex].name + " (Seal)");
		}
		if(this.hasAtIndex("Threaten Res", this.cIndex)){
			threatDebuffs.res = Math.min(threatDebuffs.res,-this.hasAtIndex("Threaten Res", this.cIndex)-2);
			skillNames.push(data.skills[this.cIndex].name);
		}
		if(this.hasAtIndex("Threaten Res", this.sIndex)){
			threatDebuffs.res = Math.min(threatDebuffs.res,-this.hasAtIndex("Threaten Res", this.sIndex)-2);
			skillNames.push(data.skills[this.sIndex].name + " (Seal)");
		}

		//Weapons
		if (this.has("Fensalir") && this.refineIndex == -1){
			threatDebuffs.atk = Math.min(threatDebuffs.atk, -4);
			skillNames.push("Fensalir");
		}
		if (this.hasExactly("Eckesachs")){
			if (this.refineIndex == -1){
				threatDebuffs.def = Math.min(threatDebuffs.def, -4);
				skillNames.push("Eckesachs");
			}else if (enemy.weaponType != "dragon"){
				threatDebuffs.def = Math.min(threatDebuffs.def, -6);
				skillNames.push("Eckesachs (Refined)");
			}
		}

		if (skillNames.length > 0){
			var statChanges = [];
			for(var stat in threatDebuffs){
				if(threatDebuffs[stat] < Math.min(enemy.debuffs[stat], enemy.combatDebuffs[stat])){
					enemy.combatDebuffs[stat] = threatDebuffs[stat];
					statChanges.push(stat + " " + threatDebuffs[stat]);
				}
			}

			if(statChanges.length > 0){
				threatenText += this.name + " has turn-start skills: " + skillNames.join(", ") + ".<br>" + enemy.name + " receives the following: " + statChanges.join(", ") + ".<br>";
			}
		}

		return threatenText;
	}

	//Turn counting is complicated due to mix & matching turn order, will revisit later if necessary.
	//Currently renew repeat effects are not applied since there are only 4 rounds (2 exchanges max) in this simulator
	//TODO: Implement Turn counting properly for more than 4 rounds
	this.buffStart = function(buffRound){
		var startText = "";

		//Effects that apply on renewal turn
		//TODO: Fix round counting for renewal effects
		if (buffRound == 1){
			if (this.has("Renewal")){
				//Every other turn - if(turn % (5 - this.has("Renewal")) == 0){
				if(this.hp + 10 > this.maxHp){
					this.hp = this.maxHp;
				} else{
					this.hp += 10;
				}
				startText += this.name + " heals 10 HP due to Renewal.<br>";
			}
			if (this.hasExactly("S Drink")){
				if(this.hp + 99 > this.maxHp){
					this.hp = this.maxHp;
				} else{
					this.hp += 99;
				}
				startText += this.name + " heals 99 HP due to S Drink.<br>";
			}
			if (this.has("Breath of Fog")){
				//Every other turn
				if(this.hp + 10 > this.maxHp){
					this.hp = this.maxHp;
				} else{
					this.hp += 10;
				}
				startText += this.name + " heals 10 HP due to " + data.skills[this.weaponIndex].name + ".<br>";
			}
			if (this.hasExactly("Falchion")){
				//Not refined - every third turn - if(turn % 3 == 0){
				if (this.refineIndex == -1){
					if (this.hp + 10 > this.maxHp){
						this.hp = this.maxHp;
					} else{
						this.hp += 10;
					}
					startText += this.name + " heals 10 HP due to Falchion.<br>";
				}
				//Refined - every other turn
				else {
					if (this.hp + 10 > this.maxHp){
						this.hp = this.maxHp;
					} else{
						this.hp += 10;
					}
					startText += this.name + " heals 10 HP due to Falchion (Refined).<br>";
				}
			}
		}

		//Effects that apply every turn
		if (this.hasExactly("Recover Ring")){
			if(this.hp + 10 > this.maxHp){
				this.hp = this.maxHp;
			} else{
				this.hp += 10;
			}
			startText += this.name + " heals 10 HP due to Recover Ring.<br>";
		}

		return startText;
	}

	this.debuffStart = function(debuffRound, enemy){
		var startText = "";
		var skillName = "";
		var damage = 0;
		var healAmount = 0;

		//TODO: Fix round counting for skadi/blight effects
		if (debuffRound == 1){
			if (this.has("Skadi")){
				skillName = data.skills[this.weaponIndex].name;
				damage = 10;
				enemy.panicked = true;
				startText += this.name + " activates " + skillName + ", inflicting panic on " + enemy.name + ".<br>";
			}
			if (this.has("Breath of Blight")){
				skillName = data.skills[this.weaponIndex].name;
				damage = 10;
				healAmount = this.adjacent2_foe * 5;
				if(this.hp + healAmount > this.maxHp){
					this.hp = this.maxHp;
				} else{
					this.hp += healAmount;
				}

				startText += this.name + " activates " + skillName + " and heals " + healAmount + " HP.<br>";

			}
			if (this.has("Imhullu")){
				skillName = data.skills[this.weaponIndex].name;
				damage = 5;
				enemy.lit = true;
				startText += this.name + " activates " + skillName + ", inflicting " + enemy.name + " with an inability to make counterattacks.<br>";
			}
		}

		//Poison damage does not kill
		if(enemy.hp - damage <= 0){
			damage = enemy.hp - 1;
		}

		//Deal damage
		if (damage != 0){
			enemy.hp -= damage;
			startText += enemy.name + " takes " + damage + " damage at start of turn from " + skillName + ".<br>";
		}

		if (this.hasExactly("Sinmara")){
			skillName = data.skills[this.weaponIndex].name;
			enemy.hp -= 20;
			startText += enemy.name + " takes 20 damage at start of turn from " + skillName + ".<br>";
		}

		return startText;
	}

	//Turn start charge effects
	this.charging = function(){
		var chargingText = "";

		//Weapon
		//TODO: Check if Berserk Armads stacks with Wrath
		if (this.hasExactly("Berserk Armads") && getSpecialType(data.skills[this.specialIndex]) == "offensive"){
			if(this.hp/this.maxHp <= .75){
				this.charge++;
				chargingText += this.name + " gains 1 extra charge with " + data.skills[this.weaponIndex].name + ".<br>";
			}
		}
		if (this.hasExactly("Tome of Thoron") && getSpecialType(data.skills[this.specialIndex]) == "offensive"){
			if(this.hp/this.maxHp <= .75){
				this.charge++;
				chargingText += this.name + " gains 1 extra charge with " + data.skills[this.weaponIndex].name + ".<br>";
			}
		}
		//Wrath
		if (this.has("Wrath") && getSpecialType(data.skills[this.specialIndex]) == "offensive"){
			if(this.hp/this.maxHp <= .25 * this.has("Wrath")){
				this.charge++;
				chargingText += this.name + " gains 1 extra charge with " + data.skills[this.bIndex].name + ".<br>";
			}
		}

		return chargingText;
	}

	this.turnStartDebuff = function(enemy){
		var debuffText = "";
		var skillNames = [];
		var debuffVal = {"atk":0,"spd":0,"def":0,"res":0};

		//Chill Debuff
		if ((enemy.challenger && options.chilled_challenger) || (!enemy.challenger && options.chilled_enemy)){
			if (this.hasExactly("Kumade+")){
				debuffVal.atk = Math.min(debuffVal.atk, -5);
				debuffVal.spd = Math.min(debuffVal.spd, -5);
				skillNames.push("Kumade+");
			}
			if (this.hasExactly("Kumade")){
				debuffVal.atk = Math.min(debuffVal.atk, -3);
				debuffVal.spd = Math.min(debuffVal.spd, -3);
				skillNames.push("Kumade");
			}
			if (this.hasExactly("Huginn's Egg") && this.hp / this.maxHp >= 0.5){
				debuffVal.atk = Math.min(debuffVal.atk, -5);
				debuffVal.def = Math.min(debuffVal.def, -5);
				skillNames.push("Huginn's Egg");
			}
			if (this.hasExactly("Muninn's Egg") && this.hp / this.maxHp >= 0.5){
				debuffVal.atk = Math.min(debuffVal.atk, -5);
				debuffVal.res = Math.min(debuffVal.res, -5);
				skillNames.push("Muninn's Egg");
			}
			if (this.hasExactly("Chilling Seal") && this.hp / this.maxHp >= 0.5){
				debuffVal.atk = Math.min(debuffVal.atk, -6);
				debuffVal.spd = Math.min(debuffVal.spd, -6);
				skillNames.push("Chilling Seal");
			}
			if (this.hasExactly("Freezing Seal") && this.hp / this.maxHp >= 0.5){
				debuffVal.atk = Math.min(debuffVal.atk, -6);
				debuffVal.spd = Math.min(debuffVal.spd, -6);
				skillNames.push("Freezing Seal");
			}
			if (this.has("Chill Atk")){
				debuffVal.atk = Math.min(debuffVal.atk, -this.hasAtIndex("Chill Atk", this.bIndex) * 2 - 1);
				skillNames.push("Chill Atk");
			}
			if (this.has("Chill Spd")){
				debuffVal.spd = Math.min(debuffVal.spd, -this.hasAtIndex("Chill Spd", this.bIndex) * 2 - 1);
				skillNames.push("Chill Spd");
			}
			if (this.has("Chill Def")){
				debuffVal.def = Math.min(debuffVal.def, -this.hasAtIndex("Chill Def", this.bIndex) * 2 - 1);
				skillNames.push("Chill Def");
			}
			if (this.has("Chill Res")){
				debuffVal.res = Math.min(debuffVal.res, -this.hasAtIndex("Chill Res", this.bIndex) * 2 - 1);
				skillNames.push("Chill Res");
			}
			if(this.hasExactly("Hikami")){
				debuffVal.atk = Math.min(debuffVal.atk, -4);
				debuffVal.spd = Math.min(debuffVal.spd, -4);
				debuffVal.def = Math.min(debuffVal.def, -4);
				debuffVal.res = Math.min(debuffVal.res, -4);
				skillNames.push("Hikami");
			}
			if(this.hasExactly("Wind's Brand")){
				debuffVal.atk = Math.min(debuffVal.atk, -7);
				skillNames.push("Wind's Brand");
			}
			if(this.has("Geishun")){
				debuffVal.atk = Math.min(debuffVal.atk, -7);
				skillNames.push("Geishun");
			}
			if(this.has("Kabura Ya")){
				debuffVal.spd = Math.min(debuffVal.spd, -7);
				skillNames.push("Kabura Ya");
			}
			if(this.has("Wagasa")){
				debuffVal.def = Math.min(debuffVal.def, -7);
				skillNames.push("Wagasa");
			}
			if (this.hasExactly("Forblaze")){
				debuffVal.res = Math.min(debuffVal.res, -7);
				skillNames.push("Forblaze");
			}
		}

		if(skillNames.length > 0){
			var statChanges = [];
			for(var stat in debuffVal){
				if(debuffVal[stat] < Math.min(enemy.debuffs[stat], enemy.combatDebuffs[stat])){
					enemy.combatDebuffs[stat] = debuffVal[stat];
					statChanges.push(stat + " " + debuffVal[stat]);
				}
			}

			if(statChanges.length > 0){
				debuffText += enemy.name + " is affected by turn-start debuffs: " + skillNames.join(", ") + ".<br>" + enemy.name + " receives the following: " + statChanges.join(", ") + ".<br>";
			}
		}

		return debuffText;
	}

	this.turnStartBuff = function(){
		var buffText = "";
		var skillNames = [];
		var buffVal = {"atk":0,"spd":0,"def":0,"res":0};

		//Odd/Even turn buffs
		if ((this.challenger && options.odd_buff_challenger) || (!this.challenger && options.odd_buff_enemy)){
			//Odd
			if(this.has("Odd Atk Wave")){
				buffVal.atk = Math.max(buffVal.atk, this.has("Odd Atk Wave") * 2);
				skillNames.push(data.skills[this.cIndex].name);
			}
			if(this.has("Odd Spd Wave")){
				buffVal.spd = Math.max(buffVal.spd, this.has("Odd Spd Wave") * 2);
				skillNames.push(data.skills[this.cIndex].name);
			}
			if(this.has("Odd Def Wave")){
				buffVal.def = Math.max(buffVal.def, this.has("Odd Def Wave") * 2);
				skillNames.push(data.skills[this.cIndex].name);
			}
			if(this.has("Odd Res Wave")){
				buffVal.res = Math.max(buffVal.res, this.has("Odd Res Wave") * 2);
				skillNames.push(data.skills[this.cIndex].name);
			}
			if(this.hasExactly("Byleistr")){
				buffVal.atk = Math.max(buffVal.atk, 4);
				buffVal.spd = Math.max(buffVal.spd, 4);
				buffVal.def = Math.max(buffVal.def, 4);
				buffVal.res = Math.max(buffVal.res, 4);
				skillNames.push(data.skills[this.weaponIndex].name);
			}
			//Even
			if(this.has("Even Atk Wave")){
				buffVal.spd = Math.max(buffVal.atk, this.has("Even Atk Wave") * 2);
				skillNames.push(data.skills[this.cIndex].name);
			}
			if(this.has("Even Spd Wave")){
				buffVal.spd = Math.max(buffVal.spd, this.has("Even Spd Wave") * 2);
				skillNames.push(data.skills[this.cIndex].name);
			}
			if(this.has("Even Def Wave")){
				buffVal.def = Math.max(buffVal.def, this.has("Even Def Wave") * 2);
				skillNames.push(data.skills[this.cIndex].name);
			}
			if(this.has("Even Res Wave")){
				buffVal.res = Math.max(buffVal.res, this.has("Even Res Wave") * 2);
				skillNames.push(data.skills[this.cIndex].name);
			}
		}

		//All defiant skills trigger at or below 50% HP
		if (this.hp / this.maxHp <= 0.5){
			if (this.has("Folkvangr") && this.refineIndex == -1){
				buffVal.atk = Math.max(buffVal.atk, 5);
				skillNames.push(data.skills[this.weaponIndex].name);
			}
			if (this.has("Defiant Atk")){
				buffVal.atk = Math.max(buffVal.atk, this.has("Defiant Atk") * 2 + 1);
				skillNames.push(data.skills[this.aIndex].name);
			}
			if (this.has("Defiant Spd")){
				buffVal.spd = Math.max(buffVal.spd, this.has("Defiant Spd") * 2 + 1);
				skillNames.push(data.skills[this.aIndex].name);
			}
			if (this.has("Defiant Def")){
				buffVal.def = Math.max(buffVal.def, this.has("Defiant Def") * 2 + 1);
				skillNames.push(data.skills[this.aIndex].name);
			}
			if (this.has("Defiant Res")){
				buffVal.res = Math.max(buffVal.res, this.has("Defiant Res") * 2 + 1);
				skillNames.push(data.skills[this.aIndex].name);
			}
		}

		//Adjacent skills
		if (this.adjacent > 0){
			if (this.has("Ardent Service")){
				buffVal.atk = Math.max(buffVal.atk, 4);
				skillNames.push(data.skills[this.weaponIndex].name);
			}
			if (this.has("Fresh Bouquet")){
				buffVal.spd = Math.max(buffVal.spd, 4);
				skillNames.push(data.skills[this.weaponIndex].name);
			}
			if (this.hasExactly("With Everyone!")){
				buffVal.def = Math.max(buffVal.def, 5);
				buffVal.res = Math.max(buffVal.res, 5);
				skillNames.push(data.skills[this.cIndex].name);
			}
		}

		if(skillNames.length > 0){
			var statChanges = [];
			for(var stat in buffVal){
				if(buffVal[stat] > Math.max(this.buffs[stat], this.combatBuffs[stat])){
					this.combatBuffs[stat] = buffVal[stat];
					statChanges.push(stat + " +" + buffVal[stat]);
				}
			}

			if(statChanges.length > 0){
				buffText += this.name + " is affected by turn-start buffs: " + skillNames.join(", ") + ".<br>" + this.name + " receives the following: " + statChanges.join(", ") + ".<br>";
			}
		}

		return buffText;
	}

	//For buffs that act like spur and stack
	//Must be passed enemy for Earth Boost
	this.setCombatSpur = function(enemy){
		var boostText = "";

		//Ally Support
		switch (this.ally){
			case "s":
				this.combatSpur.atk += 2;
				this.combatSpur.spd += 2;
				this.combatSpur.def += 2;
				this.combatSpur.res += 2;
				boostText += this.name + " gets +2 atk/spd/def/res from ally support.<br>";
				break;
			case "s-":
				this.combatSpur.atk += 1;
				this.combatSpur.spd += 1;
				this.combatSpur.def += 1;
				this.combatSpur.res += 1;
				boostText += this.name + " gets +1 atk/spd/def/res from ally support.<br>";
				break;
			case "a":
				this.combatSpur.spd += 2;
				this.combatSpur.def += 2;
				this.combatSpur.res += 2;
				boostText += this.name + " gets +2 spd/def/res from ally support.<br>";
				break;
			case "a-":
				this.combatSpur.spd += 1;
				this.combatSpur.def += 1;
				this.combatSpur.res += 1;
				boostText += this.name + " gets +1 spd/def/res from ally support.<br>";
				break;
			case "b":
				this.combatSpur.def += 2;
				this.combatSpur.res += 2;
				boostText += this.name + " gets +2 def/res from ally support.<br>";
				break;
			case "b-":
				this.combatSpur.def += 1;
				this.combatSpur.res += 1;
				boostText += this.name + " gets +1 def/res from ally support.<br>";
				break;
			case "c":
				this.combatSpur.res += 2;
				boostText += this.name + " gets +2 res from ally support.<br>";
				break;
			case "c-":
				this.combatSpur.res += 1;
				boostText += this.name + " gets +1 res from ally support.<br>";
				break;
			default:
				break;
		}

		//Combat buff
		if (this.hasAtRefineIndex("Distant Atk", this.refineIndex) && enemy.range == "ranged"){
			this.combatSpur.atk += 6;
			boostText += this.name + " gets +6 Atk from " + data.refine[this.refineIndex].name + " (Refined) against a ranged opponent.<br>";
		}
		if (this.close_defed && enemy.range == "melee"){
					buffVal = 4;
					this.combatSpur.def += buffVal;
					this.combatSpur.res += buffVal;
					boostText += this.name + " gets +" + buffVal + " Def/Res against a melee opponent with Close Guard 3.<br>";
		}
		if (this.distant_defed && enemy.range == "ranged"){
					buffVal = 4;
					this.combatSpur.def += buffVal;
					this.combatSpur.res += buffVal;
					boostText += this.name + " gets +" + buffVal + " Def/Res against a ranged opponent with Distant Guard 3.<br>";
		}
		if (this.hasExactly("Exalted Falchion") && (this.buffs.atk > 0 || this.buffs.spd > 0 || this.buffs.def > 0 || this.buffs.res > 0)){
			boostText += this.name + " gets ";
			if (this.buffs.atk > 0){
				boostText += "+" + this.buffs.atk + " Atk,";
				this.combatSpur.atk += this.buffs.atk;
			}
			if (this.buffs.spd > 0){
				boostText += "+" + this.buffs.spd + " Spd,";
				this.combatSpur.spd += this.buffs.spd;
			}
			if (this.buffs.def > 0){
				boostText += "+" + this.buffs.def + " Def,";
				this.combatSpur.def += this.buffs.def;
			}
			if (this.buffs.res > 0){
				boostText += "+" + this.buffs.res + " Res,";
				this.combatSpur.res += this.buffs.res;
			}
			boostText = boostText.substring(0, boostText.length - 1);
			boostText += " from " + data.skills[this.weaponIndex].name + ".<br>";
		}
		if (this.hasExactly("Gae Bolg") && enemy.moveType != "flying"){
			this.combatSpur.atk += 5;
			this.combatSpur.def += 5;
			boostText += this.name + " gets +5 Atk/Def from " + data.skills[this.weaponIndex].name + " against a non-flying opponent.<br>";
		}
		if (this.hasExactly("Ragnarok") && this.refineIndex != -1){
			this.combatSpur.atk += 5;
			this.combatSpur.spd += 5;
			boostText += this.name + " gets +5 Atk/Spd from " + data.skills[this.weaponIndex].name + ".<br>";
		}
		if (this.hasExactly("Sagittae") && (enemy.combatStat.atk >= this.combatStat.atk + 5)){
			this.combatSpur.atk += 5;
			this.combatSpur.spd += 5;
			this.combatSpur.def += 5;
			this.combatSpur.res += 5;
			boostText += this.name + " gets +5 Atk/Spd/Def/Res from " + data.skills[this.weaponIndex].name + ".<br>";
		}
		if (this.hasExactly("Storm Sieglinde") && (this.adjacent2_foe - 1 >= this.adjacent2)){
			this.combatSpur.def += 3;
			this.combatSpur.res += 3;
			boostText += this.name + " gets +3 Def/Res from " + data.skills[this.weaponIndex].name + ".<br>";
		}
		if (this.hasExactly("Sylgr") && (this.spd > enemy.spd)){
			this.combatSpur.atk += 4;
			this.combatSpur.spd += 4;
			boostText += this.name + " gets +4 Atk/Spd from " + data.skills[this.weaponIndex].name + ".<br>";
		}
		if ((this.hasExactly("Surtr's Menace") && this.adjacent2 > 0)){
			this.combatSpur.atk += 4;
			this.combatSpur.spd += 4;
			this.combatSpur.def += 4;
			this.combatSpur.res += 4;
			boostText += this.name + " gets +4 Atk/Spd/Def/Res from " + data.skills[this.cIndex].name + ".<br>";
		}
		if ((this.hasExactly("Lyfjaberg") && this.hp/this.maxHp >= .5)){
			this.combatSpur.atk += 4;
			this.combatSpur.spd += 4;
			boostText += this.name + " gets +4 Atk/Spd from " + data.skills[this.weaponIndex].name + ".<br>";
		}

		//Combat debuff ***does this stack like spurs? does negative combatSpur work correctly?***
		if (enemy.hasExactly("Loptous")	&& !isDragonEffective(this)){
			this.combatSpur.atk -= 6;
			boostText += this.name + " gets -6 Atk from not having an \"effective against dragons\" skill against the opponent's " + data.skills[enemy.weaponIndex].name + ".<br>";
		}
		if (enemy.hasExactly("Aversa's Night") && (this.combatStartHp <= enemy.combatStartHp -3) && (this.adjacent > 0)){
			//Panic effect is added into debuff since panic is calculated before combat buffs
			this.combatSpur.atk -= 3 + 2*this.combatBuffs.atk;
			this.combatSpur.spd -= 3 + 2*this.combatBuffs.spd;
			this.combatSpur.def -= 3 + 2*this.combatBuffs.def;
			this.combatSpur.res -= 3 + 2*this.combatBuffs.res;
			this.panicked = true;
			boostText += this.name + " gets -3 Atk/Spd/Def/Res from " + data.skills[enemy.weaponIndex].name + " and is inflicted with panic.<br>";
		}
		if ((enemy.hasExactly("Book of Dreams") || enemy.hasExactly("Book of Shadows"))
			&& (enemy.adjacent > 0)
			){
			this.combatSpur.atk -= 4;
			this.combatSpur.spd -= 4;
			this.combatSpur.def -= 4;
			this.combatSpur.res -= 4;
			this.panicked = true;
			boostText += this.name + " gets -4 Atk/Spd/Def/Res from " + data.skills[enemy.weaponIndex].name + ".<br>";
		}
		if ((enemy.hasExactly("Surtr's Menace") && enemy.adjacent2 > 0)){
			this.combatSpur.atk -= 4;
			this.combatSpur.spd -= 4;
			this.combatSpur.def -= 4;
			this.combatSpur.res -= 4;
			this.panicked = true;
			boostText += this.name + " gets -4 Atk/Spd/Def/Res from " + data.skills[enemy.cIndex].name + ".<br>";
		}

		//Solo Skills
		if (this.adjacent == 0){
			if (this.has("Atk Spd Solo")){
				statBonus = this.has("Atk Spd Solo") * 2;
				this.combatSpur.atk += statBonus;
				this.combatSpur.spd += statBonus;
				skillName = data.skills[this.aIndex].name;
				boostText += this.name + " has no adjacent allies and gets +" + statBonus + " Atk/Spd from " + skillName + ".<br>";
			}
			if (this.has("Atk Def Solo")){
				statBonus = this.has("Atk Def Solo") * 2;
				this.combatSpur.atk += statBonus;
				this.combatSpur.def += statBonus;
				skillName = data.skills[this.aIndex].name;
				boostText += this.name + " has no adjacent allies and gets +" + statBonus + " Atk/Def from " + skillName + ".<br>";
			}
			if (this.has("Atk Res Solo")){
				statBonus = this.has("Atk Res Solo") * 2;
				this.combatSpur.atk += statBonus;
				this.combatSpur.res += statBonus;
				skillName = data.skills[this.aIndex].name;
				boostText += this.name + " has no adjacent allies and gets +" + statBonus + " Atk/Res from " + skillName + ".<br>";
			}
			if (this.has("Spd Def Solo")){
				statBonus = this.has("Spd Def Solo") * 2;
				this.combatSpur.spd += statBonus;
				this.combatSpur.def += statBonus;
				skillName = data.skills[this.aIndex].name;
				boostText += this.name + " has no adjacent allies and gets +" + statBonus + " Spd/Def from " + skillName + ".<br>";
			}
			if (this.has("Spd Res Solo")){
				statBonus = this.has("Spd Res Solo") * 2;
				this.combatSpur.atk += statBonus;
				this.combatSpur.res += statBonus;
				skillName = data.skills[this.aIndex].name;
				boostText += this.name + " has no adjacent allies and gets +" + statBonus + " Spd/Res from " + skillName + ".<br>";
			}
			if (this.has("Def Res Solo")){
				statBonus = this.has("Def Res Solo") * 2;
				this.combatSpur.def += statBonus;
				this.combatSpur.res += statBonus;
				skillName = data.skills[this.aIndex].name;
				boostText += this.name + " has no adjacent allies and gets +" + statBonus + " Def/Res from " + skillName + ".<br>";
			}
			if (this.hasExactly("Festive Siegmund")){
				this.combatSpur.atk += 4;
				this.combatSpur.spd += 4;
				this.combatSpur.def += 4;
				this.combatSpur.res += 4;
				skillName = data.skills[this.weaponIndex].name;
				boostText += this.name + " has no adjacent allies and gets +4 Atk/Spd/Def/Res from " + skillName + ".<br>";
			}
		}

		//Brazen Skills
		if (this.combatStartHp / this.maxHp <= 0.8){
			if (this.has("Folkvangr") && this.refineIndex != -1){
				statBonus = 7;
				this.combatSpur.atk += statBonus;
				this.combatSpur.def += statBonus;
				skillName = data.skills[this.weaponIndex].name + " (Refined)";
				boostText += this.name + " activates " + skillName + " and gets +" + statBonus + " Atk/Def.<br>";
			}
			if (this.hasAtRefineIndex("Brazen Atk Spd", this.refineIndex)){
				statBonus = 7;
				this.combatSpur.atk += statBonus;
				this.combatSpur.spd += statBonus;
				skillName = data.skills[this.weaponIndex].name;
				boostText += this.name + " activates " + skillName + " (Refined) and gets +" + statBonus + " Atk/Spd.<br>";
			}
			if (this.hasAtIndex("Brazen Atk Spd", this.aIndex)){
				statBonus = 1 + 2 * this.has("Brazen Atk Spd");
				this.combatSpur.atk += statBonus;
				this.combatSpur.spd += statBonus;
				skillName = data.skills[this.aIndex].name;
				boostText += this.name + " activates " + skillName + " and gets +" + statBonus + " Atk/Spd.<br>";
			}
			if (this.has("Brazen Atk Def")){
				statBonus = 1 + 2 * this.has("Brazen Atk Def");
				this.combatSpur.atk += statBonus;
				this.combatSpur.def += statBonus;
				skillName = data.skills[this.aIndex].name;
				boostText += this.name + " activates " + skillName + " and gets +" + statBonus + " Atk/Def.<br>";
			}
			if (this.hasAtIndex("Brazen Atk Res", this.aIndex)){
				statBonus = 1 + 2 * this.hasAtIndex("Brazen Atk Res", this.aIndex);
				this.combatSpur.atk += statBonus;
				this.combatSpur.res += statBonus;
				skillName = data.skills[this.aIndex].name;
				boostText += this.name + " activates " + skillName + " and gets +" + statBonus + " Atk/Res.<br>";
			}
			if (this.hasAtIndex("Brazen Atk Res", this.sIndex)){
				statBonus = 1 + 2 * this.hasAtIndex("Brazen Atk Res", this.sIndex);
				this.combatSpur.atk += statBonus;
				this.combatSpur.res += statBonus;
				skillName = data.skills[this.sIndex].name;
				boostText += this.name + " activates " + skillName + " and gets +" + statBonus + " Atk/Res (Seal).<br>";
			}
			if (this.has("Brazen Spd Def")){
				statBonus = 1 + 2 * this.has("Brazen Spd Def");
				this.combatSpur.spd += statBonus;
				this.combatSpur.def += statBonus;
				skillName = data.skills[this.aIndex].name;
				boostText += this.name + " activates " + skillName + " and gets +" + statBonus + " Spd/Def.<br>";
			}
			if (this.has("Brazen Spd Res")){
				statBonus = 1 + 2 * this.has("Brazen Spd Res");
				this.combatSpur.spd += statBonus;
				this.combatSpur.res += statBonus;
				skillName = data.skills[this.aIndex].name;
				boostText += this.name + " activates " + skillName + " and gets +" + statBonus + " Spd/Res.<br>";
			}
			if (this.has("Brazen Def Res")){
				statBonus = 1 + 2 * this.has("Brazen Def Res");
				this.combatSpur.def += statBonus;
				this.combatSpur.res += statBonus;
				skillName = data.skills[this.aIndex].name;
				boostText += this.name + " activates " + skillName + " and gets +" + statBonus + " Def/Res.<br>";
			}
		}

		//Full Health Skills
		if(this.combatStartHp / this.maxHp >= 1){
			if(this.hasExactly("Ragnarok") && this.refineIndex == -1){
				//Does this take effect when defending? Answer: yes
				this.combatSpur.atk += 5;
				this.combatSpur.spd += 5;
				boostText += this.name + " gets +5 Atk/Spd from being at full health with " + data.skills[this.weaponIndex].name + ".<br>";
			}
			if(this.hasExactly("Beloved Zofia")){
				this.combatSpur.atk += 4;
				this.combatSpur.spd += 4;
				this.combatSpur.def += 4;
				this.combatSpur.res += 4;
				boostText += this.name + " gets +4 Atk/Spd/Def/Res from being at full health with " + data.skills[this.weaponIndex].name + ".<br>";
			}
			if(this.has("Seashell") || this.has("Refreshing Bolt") || this.has("Deft Harpoon") || this.has("Melon Crusher")){
				this.combatSpur.atk += 2;
				this.combatSpur.spd += 2;
				this.combatSpur.def += 2;
				this.combatSpur.res += 2;
				boostText += this.name + " gets +2 Atk/Spd/Def/Res from being at full health with " + data.skills[this.weaponIndex].name + ".<br>";
			}
			if(this.has("Atk Spd Push")){
				statBonus = this.has("Atk Spd Push") + 2;
				this.combatSpur.atk += statBonus;
				this.combatSpur.spd += statBonus;
				boostText += this.name + " gets +" + statBonus+ " Atk/Spd from being at full health with " + data.skills[this.aIndex].name + ".<br>";
			}
			if(this.has("Atk Def Push")){
				statBonus = this.has("Atk Def Push") + 2;
				this.combatSpur.atk += statBonus;
				this.combatSpur.def += statBonus;
				boostText += this.name + " gets +" + statBonus+ " Atk/Def from being at full health with " + data.skills[this.aIndex].name + ".<br>";
			}
			if(this.has("Atk Res Push")){
				statBonus = this.has("Atk Res Push") + 2;
				this.combatSpur.atk += statBonus;
				this.combatSpur.res += statBonus;
				boostText += this.name + " gets +" + statBonus+ " Atk/Res from being at full health with " + data.skills[this.aIndex].name + ".<br>";
			}
			if(this.has("Spd Def Push")){
				statBonus = this.has("Spd Def Push") + 2;
				this.combatSpur.spd += statBonus;
				this.combatSpur.def += statBonus;
				boostText += this.name + " gets +" + statBonus+ " Spd/Def from being at full health with " + data.skills[this.aIndex].name + ".<br>";
			}
			if(this.has("Spd Res Push")){
				statBonus = this.has("Spd Res Push") + 2;
				this.combatSpur.spd += statBonus;
				this.combatSpur.res += statBonus;
				boostText += this.name + " gets +" + statBonus+ " Spd/Res from being at full health with " + data.skills[this.aIndex].name + ".<br>";
			}
			if(this.has("Def Res Push")){
				statBonus = this.has("Def Res Push") + 2;
				this.combatSpur.def += statBonus;
				this.combatSpur.res += statBonus;
				boostText += this.name + " gets +" + statBonus+ " Def/Res from being at full health with " + data.skills[this.aIndex].name + ".<br>";
			}
		//Not Full Health Skills
		}else {
			if(this.hasExactly("Sealed Falchion")){
				this.combatSpur.atk += 5;
				this.combatSpur.spd += 5;
				this.combatSpur.def += 5;
				this.combatSpur.res += 5;
				boostText += this.name + " gets +5 Atk/Spd/Def/Res from having less than full health with " + data.skills[this.weaponIndex].name + ".<br>";
			}
		}

		//Enemy Full Health Skills
		if(enemy.combatStartHp / enemy.maxHp >= 1){
			if(this.has("Regal Blade")){
				if (this.refineIndex == -1) {
					this.combatSpur.atk += 2;
					this.combatSpur.spd += 2;
					boostText += this.name + " gets +2 Atk/Spd with " + data.skills[this.weaponIndex].name + " from " + enemy.name + " being at full health.<br>";
				} else {
					this.combatSpur.atk += 3;
					this.combatSpur.spd += 3;
					boostText += this.name + " gets +3 Atk/Spd with " + data.skills[this.weaponIndex].name + " (Refined) from " + enemy.name + " being at full health.<br>";
				}
			}

			if(this.hasExactly("Gleipnir") || this.hasExactly("Ivaldi")){
				this.combatSpur.atk += 3;
				this.combatSpur.spd += 3;
				boostText += this.name + " gets +3 Atk/Spd with " + data.skills[this.weaponIndex].name + " from " + enemy.name + " being at full health.<br>";
			}
		}

		//Boost Skills
		if(this.hp >= enemy.hp + 3){
			var skillName = "";
			var buffVal = 0;

			if(this.hasAtIndex("Earth Boost", this.aIndex)){
				buffVal = this.has("Earth Boost", this.aIndex) * 2;
				skillName = data.skills[this.aIndex].name;
				this.combatSpur.def += buffVal;
				boostText += this.name + " gets +" + buffVal + " Def from having >=3 more hp than " + enemy.name + " with " + skillName + ".<br>";
			}
			if(this.hasAtIndex("Earth Boost", this.sIndex)){
				buffVal = this.has("Earth Boost", this.sIndex) * 2;
				skillName = data.skills[this.sIndex].name + " (Seal)";
				this.combatSpur.def += buffVal;
				boostText += this.name + " gets +" + buffVal + " Def from having >=3 more hp than " + enemy.name + " with " + skillName + ".<br>";
			}
			if(this.hasAtIndex("Wind Boost", this.aIndex)){
				buffVal = this.hasAtIndex("Wind Boost", this.aIndex) * 2;
				skillName = data.skills[this.aIndex].name;
				this.combatSpur.spd += buffVal;
				boostText += this.name + " gets +" + buffVal + " Spd from having >=3 more hp than " + enemy.name + " with " + skillName + ".<br>";
			}
			if(this.hasAtIndex("Wind Boost", this.sIndex)){
				buffVal = this.hasAtIndex("Wind Boost", this.sIndex) * 2;
				skillName = data.skills[this.sIndex].name + " (Seal)";
				this.combatSpur.spd += buffVal;
				boostText += this.name + " gets +" + buffVal + " Spd from having >=3 more hp than " + enemy.name + " with " + skillName + ".<br>";
			}
			if(this.hasAtIndex("Fire Boost", this.aIndex)){
				buffVal = this.hasAtIndex("Fire Boost", this.aIndex) * 2;
				skillName = data.skills[this.aIndex].name;
				this.combatSpur.atk += buffVal;
				boostText += this.name + " gets +" + buffVal + " Atk from having >=3 more hp than " + enemy.name + " with " + skillName + ".<br>";
			}
			if(this.hasAtIndex("Fire Boost", this.sIndex)){
				buffVal = this.hasAtIndex("Fire Boost", this.sIndex) * 2;
				skillName = data.skills[this.sIndex].name + " (Seal)";
				this.combatSpur.atk += buffVal;
				boostText += this.name + " gets +" + buffVal + " Atk from having >=3 more hp than " + enemy.name + " with " + skillName + ".<br>";
			}
			if(this.hasAtIndex("Water Boost", this.aIndex)){
				buffVal = this.hasAtIndex("Water Boost", this.aIndex) * 2;
				skillName = data.skills[this.aIndex].name;
				this.combatSpur.res += buffVal;
				boostText += this.name + " gets +" + buffVal + " Res from having >=3 more hp than " + enemy.name + " with " + skillName + ".<br>";
			}
			if(this.hasAtIndex("Water Boost", this.sIndex)){
				buffVal = this.hasAtIndex("Water Boost", this.sIndex) * 2;
				skillName = data.skills[this.sIndex].name + " (Seal)";
				this.combatSpur.res += buffVal;
				boostText += this.name + " gets +" + buffVal + " Res from having >=3 more hp than " + enemy.name + " with " + skillName + ".<br>";
			}
		}

		// Skills
		if(this.hasExactly("Combat Bonuses Resistance Victory") && this.res >= enemy.res + 3){
			var skillName = data.skills[this.weaponIndex].name;
			var buffVal = 3;
			this.combatSpur.atk += buffVal;
			this.combatSpur.spd += buffVal;
			this.combatSpur.def += buffVal;
			this.combatSpur.res += buffVal;
			boostText += this.name + " gets +" + buffVal + " Atk/Spd/Def/Res from having >=3 more res than " + enemy.name + " with " + skillName + " (Refined).<br>";
		}

		//Adjacent Foe Buffs
		if (this.hasExactly("Wolf Berg") && this.adjacent2_foe - 1 >= this.adjacent2){
			var buffVal = 4;
			var skillName = data.skills[this.weaponIndex].name;
			this.combatSpur.atk += buffVal;
			this.combatSpur.spd += buffVal;
			this.combatSpur.def += buffVal;
			this.combatSpur.res += buffVal;
			boostText += this.name + " gets +" + buffVal + " Atk/Spd/Def/Res from having more adjacent foes with " + skillName + ".<br>";
		}

		//Adjacent Buffs
		if (this.adjacent > 0){
			var skillName = "";
			var buffVal = 0;

			//Weapons
			if (this.hasAtRefineIndex("All Bond", this.refineIndex)){
				buffVal = 4;
				skillName = data.skills[this.weaponIndex].name;
				this.combatSpur.atk += buffVal;
				this.combatSpur.spd += buffVal;
				this.combatSpur.def += buffVal;
				this.combatSpur.res += buffVal;
				boostText += this.name + " gets +" + buffVal + " Atk/Spd/Def/Res from being adjacent to an ally with " + skillName + " (Refined).<br>";
            }

			//Owl Tomes
			if (this.has("Blarowl") || this.has("Gronnowl") || this.has("Raudrowl") || this.hasExactly("Nidhogg") || this.hasExactly("Reese's Tome")){
				buffVal = this.adjacent * 2;
				skillName = data.skills[this.weaponIndex].name;
				this.combatSpur.atk += buffVal;
				this.combatSpur.spd += buffVal;
				this.combatSpur.def += buffVal;
				this.combatSpur.res += buffVal;
				boostText += this.name + " gets +" + buffVal + " Atk/Spd/Def/Res from being adjacent to " + this.adjacent + " allies with " + skillName + ".<br>";
			}
			if (this.hasAtRefineIndex("Owl Bond", this.refineIndex)){
				buffVal = this.adjacent * 2;
				skillName = data.skills[this.weaponIndex].name;
				this.combatSpur.atk += buffVal;
				this.combatSpur.spd += buffVal;
				this.combatSpur.def += buffVal;
				this.combatSpur.res += buffVal;
				boostText += this.name + " gets +" + buffVal + " Atk/Spd/Def/Res from being adjacent to " + this.adjacent + " allies with " + skillName + " (Refined).<br>";
			}

			//Bond skills
			if (this.hasAtIndex("Atk Spd Bond", this.aIndex)){
				buffVal = this.hasAtIndex("Atk Spd Bond", this.aIndex) + 2;
				skillName = data.skills[this.aIndex].name;
				this.combatSpur.atk += buffVal;
				this.combatSpur.spd += buffVal;
				boostText += this.name + " gets +" + buffVal + " Atk/Spd from being adjacent to an ally with " + skillName + ".<br>";
			}
			if (this.hasAtIndex("Atk Spd Bond", this.sIndex)){
				buffVal = this.hasAtIndex("Atk Spd Bond", this.sIndex) + 2;
				skillName = data.skills[this.sIndex].name + " (Seal)";
				this.combatSpur.atk += buffVal;
				this.combatSpur.spd += buffVal;
				boostText += this.name + " gets +" + buffVal + " Atk/Spd from being adjacent to an ally with " + skillName + ".<br>";
			}
			if (this.hasAtIndex("Atk Def Bond", this.aIndex)){
				buffVal = this.hasAtIndex("Atk Def Bond", this.aIndex) + 2;
				skillName = data.skills[this.aIndex].name;
				this.combatSpur.atk += buffVal;
				this.combatSpur.def += buffVal;
				boostText += this.name + " gets +" + buffVal + " Atk/Def from being adjacent to an ally with " + skillName + ".<br>";
			}
			if (this.hasAtIndex("Atk Def Bond", this.sIndex)){
				buffVal = this.hasAtIndex("Atk Def Bond", this.sIndex) + 2;
				skillName = data.skills[this.sIndex].name + " (Seal)";
				this.combatSpur.atk += buffVal;
				this.combatSpur.def += buffVal;
				boostText += this.name + " gets +" + buffVal + " Atk/Def from being adjacent to an ally with " + skillName + ".<br>";
			}
			if (this.hasAtIndex("Atk Res Bond", this.aIndex)){
				buffVal = this.hasAtIndex("Atk Res Bond", this.aIndex) + 2;
				skillName = data.skills[this.aIndex].name;
				this.combatSpur.atk += buffVal;
				this.combatSpur.res += buffVal;
				boostText += this.name + " gets +" + buffVal + " Atk/Res from being adjacent to an ally with " + skillName + ".<br>";
			}
			if (this.hasAtIndex("Atk Res Bond", this.sIndex)){
				buffVal = this.hasAtIndex("Atk Res Bond", this.sIndex) + 2;
				skillName = data.skills[this.sIndex].name + " (Seal)";
				this.combatSpur.atk += buffVal;
				this.combatSpur.res += buffVal;
				boostText += this.name + " gets +" + buffVal + " Atk/Res from being adjacent to an ally with " + skillName + ".<br>";
			}
			if (this.hasAtIndex("Spd Def Bond", this.aIndex)){
				buffVal = this.hasAtIndex("Spd Def Bond", this.aIndex) + 2;
				skillName = data.skills[this.aIndex].name;
				this.combatSpur.spd += buffVal;
				this.combatSpur.def += buffVal;
				boostText += this.name + " gets +" + buffVal + " Spd/Def from being adjacent to an ally with " + skillName + ".<br>";
			}
			if (this.hasAtIndex("Spd Def Bond", this.sIndex)){
				buffVal = this.hasAtIndex("Spd Def Bond", this.sIndex) + 2;
				skillName = data.skills[this.sIndex].name + " (Seal)";
				this.combatSpur.spd += buffVal;
				this.combatSpur.def += buffVal;
				boostText += this.name + " gets +" + buffVal + " Spd/Def from being adjacent to an ally with " + skillName + ".<br>";
			}
			if (this.hasAtIndex("Spd Res Bond", this.aIndex)){
				buffVal = this.hasAtIndex("Spd Res Bond", this.aIndex) + 2;
				skillName = data.skills[this.aIndex].name;
				this.combatSpur.spd += buffVal;
				this.combatSpur.res += buffVal;
				boostText += this.name + " gets +" + buffVal + " Spd/Res from being adjacent to an ally with " + skillName + ".<br>";
			}
			if (this.hasAtIndex("Def Res Bond", this.aIndex)){
				buffVal = this.hasAtIndex("Def Res Bond", this.aIndex) + 2;
				skillName = data.skills[this.aIndex].name;
				this.combatSpur.def += buffVal;
				this.combatSpur.res += buffVal;
				boostText += this.name + " gets +" + buffVal + " Def/Res from being adjacent to an ally with " + skillName + ".<br>";
			}
			if (this.hasAtIndex("Spd Res Bond", this.sIndex)){
				buffVal = this.hasAtIndex("Spd Res Bond", this.sIndex) + 2;
				skillName = data.skills[this.sIndex].name + " (Seal)";
				this.combatSpur.spd += buffVal;
				this.combatSpur.res += buffVal;
				boostText += this.name + " gets +" + buffVal + " Spd/Res from being adjacent to an ally with " + skillName + ".<br>";
			}
			if (this.hasAtIndex("Def Res Bond", this.aIndex)){
				buffVal = this.hasAtIndex("Def Res Bond", this.aIndex) + 2;
				skillName = data.skills[this.aIndex].name;
				this.combatSpur.def += buffVal;
				this.combatSpur.res += buffVal;
				boostText += this.name + " gets +" + buffVal + " Def/Res from being adjacent to an ally with " + skillName + ".<br>";
			}
			if (this.hasAtIndex("Def Res Bond", this.sIndex)){
				buffVal = this.hasAtIndex("Def Res Bond", this.sIndex) + 2;
				skillName = data.skills[this.sIndex].name + " (Seal)";
				this.combatSpur.def += buffVal;
				this.combatSpur.res += buffVal;
				boostText += this.name + " gets +" + buffVal + " Def/Res from being adjacent to an ally with " + skillName + ".<br>";
			}
			if (this.hasAtRefineIndex("Spd Def Bond", this.refineIndex)){
				buffVal = 5;
				skillName = "Spd Def Bond";
				this.combatSpur.spd += buffVal;
				this.combatSpur.def += buffVal;
				boostText += this.name + " gets +" + buffVal + " Spd/Def from being adjacent an ally with " + skillName + " (Refined).<br>";
			}
			if (this.hasAtRefineIndex("Spd Def Bond", this.refineIndex)){
				buffVal = 5;
				skillName = "Spd Def Bond";
				this.combatSpur.spd += buffVal;
				this.combatSpur.def += buffVal;
				boostText += this.name + " gets +" + buffVal + " Spd/Def from being adjacent an ally with " + skillName + " (Refined).<br>";
			}
			if (this.hasAtRefineIndex("Atk Def Bond", this.refineIndex)){
				buffVal = 5;
				skillName = "Atd Def Bond";
				this.combatSpur.atk += buffVal;
				this.combatSpur.def += buffVal;
				boostText += this.name + " gets +" + buffVal + " Atk/Def from being adjacent an ally with " + skillName + " (Refined).<br>";	
			}
		}

		//Adjacent Buffs - Within 2 Spaces
		if (this.adjacent2 > 0){
			//Comparative Adjacent Skills
			if (this.hasAtIndex("Swift Mulagir", this.weaponIndex) && this.adjacent2 > this.adjacent2_foe){
				buffVal = 5;
				skillName = data.skills[this.weaponIndex].name;
				this.combatSpur.atk += buffVal;
				this.combatSpur.spd += buffVal;
				boostText += this.name + " gets +" + buffVal + " Atk/Spd from having more adjacent allies than foes with " + skillName + ".<br>";
			}
			if (this.hasExactly("Draconic Rage") && this.adjacent2 > this.adjacent2_foe){
				buffVal = 5;
				skillName = data.skills[this.weaponIndex].name;
				this.combatSpur.atk += buffVal;
				this.combatSpur.spd += buffVal;
				boostText += this.name + " gets +" + buffVal + " Atk/Spd from having more adjacent allies than foes with " + skillName + ".<br>";
			}

			//Weapons
			if (this.hasExactly("Hinoka's Spear")){
				buffVal = 4;
				skillName = data.skills[this.weaponIndex].name;
				this.combatSpur.atk += buffVal;
				this.combatSpur.spd += buffVal;
				boostText += this.name + " gets +" + buffVal + " Atk/Spd from being within 2 spaces of an infantry or flying ally with " + skillName + ".<br>";
			}
			if (this.hasExactly("Camilla's Axe")){
				buffVal = 4;
				skillName = data.skills[this.weaponIndex].name;
				this.combatSpur.atk += buffVal;
				this.combatSpur.spd += buffVal;
				boostText += this.name + " gets +" + buffVal + " Atk/Spd from being within 2 spaces of an cavalry or flying ally with " + skillName + ".<br>";
			}
			if (this.hasExactly("Nifl Frostflowers") || this.hasExactly("Muspell Fireposy")){
				buffVal = 2 * Math.min(3, this.adjacent2);
				skillName = data.skills[this.weaponIndex].name;
				this.combatSpur.atk += buffVal;
				this.combatSpur.spd += buffVal;
				boostText += this.name + " gets +" + buffVal + " Atk/Spd for each ally within 2 spaces with " + skillName + " (Maximum +6).<br>";
			}
			if (this.has("Glittering Breath") || this.has("Goodie Boot")){
				buffVal = 2 * Math.min(3, this.adjacent2);
				skillName = data.skills[this.weaponIndex].name;
				this.combatSpur.def += buffVal;
				this.combatSpur.res += buffVal;
				boostText += this.name + " gets " + buffVal + "Def/Res for each ally within 2 spaces with " + skillName + " (Maximum +6).<br>";
			}
			if (this.hasAtRefineIndex("Magic & Staff Atk Spd Bond", this.refineIndex)){
				buffVal = 5;
				skillName = data.skills[this.weaponIndex].name;
				this.combatSpur.atk += buffVal;
				this.combatSpur.spd += buffVal;
				boostText += this.name + " gets +" + buffVal + " Atk/Spd from being within 2 spaces of a magic or staff ally with " + skillName + " (Refined).<br>";
			}
			if (this.hasAtRefineIndex("Dragon & Sword Atk Def Bond", this.refineIndex)){
				buffVal = 5;
				skillName = data.skills[this.weaponIndex].name;
				this.combatSpur.atk += buffVal;
				this.combatSpur.def += buffVal;
				boostText += this.name + " gets +" + buffVal + " Atk/Def from being within 2 spaces of a dragon or sword ally with " + skillName + " (Refined).<br>";
			}
			if (this.hasAtRefineIndex("Flying Atk Res Bond", this.refineIndex)){
				buffVal = 5;
				skillName = "Flying Atk Res Bond";
				this.combatSpur.atk += buffVal;
				this.combatSpur.res += buffVal;
				boostText += this.name + " gets +" + buffVal + " Atk/Res from being within 2 spaces of a flying ally with " + skillName + " (Refined).<br>";
			}
			if (this.hasAtRefineIndex("Magic All Bond", this.refineIndex)){
				buffVal = 3;
				skillName = "Magic All Bond";
				this.combatSpur.atk += buffVal;
				this.combatSpur.spd += buffVal;
				this.combatSpur.def += buffVal;
				this.combatSpur.res += buffVal;
				boostText += this.name + " gets +" + buffVal + " Atk/Spd/Def/Res from being within 2 spaces of an infantry magic ally with " + skillName + " (Refined).<br>";
			}
			if (this.hasAtRefineIndex("Infantry & Armored Atk Spd Bond", this.refineIndex)){
				buffVal = 4;
				skillName = "Infantry & Armored Atk Spd Bond";
				this.combatSpur.atk += buffVal;
				this.combatSpur.spd += buffVal;
				boostText += this.name + " gets +" + buffVal + " Atk/Spd from being within 2 spaces of infantry or armored ally with " + skillName + " (Refined).<br>";
			}
			if (this.hasAtRefineIndex("Triangle", this.refineIndex)){
				buffVal = 3;
				skillName = data.skills[this.weaponIndex].name;
				this.combatSpur.atk += buffVal;
				this.combatSpur.spd += buffVal;
				this.combatSpur.def += buffVal;
				this.combatSpur.res += buffVal;
				boostText += this.name + " gets +" + buffVal + " Atk/Spd/Def/Res from being within 2 spaces of 2 flying allies with " + skillName + " (Refined).<br>";
			}
			if (this.hasAtRefineIndex("Infantry & Flying Atk Spd Bond", this.refineIndex)){
				buffVal = 4;
				skillName = data.skills[this.weaponIndex].name;
				this.combatSpur.atk += buffVal;
				this.combatSpur.spd += buffVal;
				boostText += this.name + " gets +" + buffVal + " Atk/Spd from being within 2 spaces of infantry or flying ally with " + skillName + " (Refined).<br>";
			}
		}

		//Blow Skills
		if(this.initiator){
			var skillName = "";
			var buffVal = 0;

			//Weapons
			if(this.has("Shell Lance") || this.has("Beach Banner") || this.has("Cocobow")){
				this.combatSpur.atk += 2;
				this.combatSpur.spd += 2;
				this.combatSpur.def += 2;
				this.combatSpur.res += 2;
				boostText += this.name + " gets +2 Atk/Spd/Def/Res from initiating with " + data.skills[this.weaponIndex].name + ".<br>";
			}
			if(this.has("Thogn") && enemy.range == "melee"){
				this.combatSpur.atk += 4;
				this.combatSpur.spd += 4;
				this.combatSpur.def += 4;
				this.combatSpur.res += 4;
				boostText += this.name + " gets +4 Atk/Spd/Def/Res from initiating with " + data.skills[this.weaponIndex].name + " against a melee opponent.<br>";
			}
			if(this.hasExactly("Durandal")){
				this.combatSpur.atk += 4;
				boostText += this.name + " gets +4 Atk from initiating with " + data.skills[this.weaponIndex].name + ".<br>"
			}
			if(this.hasExactly("Dark Greatsword")){
				this.combatSpur.atk += 4;
				this.combatSpur.spd += 4;
				boostText += this.name + " gets +4 Atk/Spd from initiating with " + data.skills[this.weaponIndex].name + ".<br>";
			}
			if(this.hasExactly("Yato") && this.refineIndex == -1){
				this.combatSpur.spd += 4;
				boostText += this.name + " gets +4 Spd from initiating with " + data.skills[this.weaponIndex].name + ".<br>";
			}
			if(this.hasExactly("Mjolnir")){
				this.combatSpur.spd += 6;
				boostText += this.name + " gets +6 Spd from initiating with " + data.skills[this.weaponIndex].name + ".<br>";
			}
			if(this.hasExactly("Tyrfing") && this.hp / this.maxHp <= 0.5){
				this.combatSpur.def += 4;
				boostText += this.name + " gets +4 Def in combat from " + data.skills[this.weaponIndex].name + " with <= 50% health.<br>";
			}
			if(this.hasExactly("Parthia") && this.refineIndex == -1){
				this.combatSpur.res += 4;
				boostText += this.name + " gets +4 Res from initiating with " + data.skills[this.weaponIndex].name + ".<br>";
			}
			if (this.hasAtRefineIndex("Death Blow", this.refineIndex)){
				this.combatSpur.atk += 6;
				boostText += this.name + " gets +6 Atk from initiating with " + data.skills[this.weaponIndex].name + " (Refined).<br>"
			}
			if(this.hasAtRefineIndex("Darting Blow", this.refineIndex)){
				this.combatSpur.spd += 6;
				boostText += this.name + " gets +6 Spd from initiating with " + data.skills[this.weaponIndex].name + " (Refined).<br>"
			}
			if (this.hasExactly("Hoarfrost Knife") && enemy.range == "melee"){
				this.combatSpur.def += 20;
				boostText += this.name + " gets +20 Des from initiating with " + data.skills[this.weaponIndex].name + " against a melee opponent.<br>";
			}

			//Skills
			//TODO: Combine skills with separated parts such as Swift Sparrow into one if statement
			//TODO: Add checks for possible overlapping buffs with future skills
			if(this.hasAtIndex("Death Blow", this.aIndex)){
				buffVal = this.hasAtIndex("Death Blow", this.aIndex) * 2;
				skillName = data.skills[this.aIndex].name;
				this.combatSpur.atk += buffVal;
				boostText += this.name + " gets +" + buffVal + " Atk from initiating with " + skillName + ".<br>";
			}
			if(this.has("Swift Sparrow")){
				buffVal = this.has("Swift Sparrow") * 2;
				skillName = data.skills[this.aIndex].name;
				this.combatSpur.atk += buffVal;
				boostText += this.name + " gets +" + buffVal + " Atk from initiating with " + skillName + ".<br>";
			}
			if(this.has("Sturdy Blow")){
				buffVal = this.has("Sturdy Blow") * 2;
				skillName = data.skills[this.aIndex].name;
				this.combatSpur.atk += buffVal;
				boostText += this.name + " gets +" + buffVal + " Atk from initiating with " + skillName + ".<br>";
			}
			if(this.has("Mirror Strike")){
				buffVal = this.has("Mirror Strike") * 2;
				skillName = data.skills[this.aIndex].name;
				this.combatSpur.atk += buffVal;
				boostText += this.name + " gets +" + buffVal + " Atk from initiating with " + skillName + ".<br>";
			}

			if(this.has("Darting Blow")){
				buffVal = this.has("Darting Blow") * 2;
				skillName = data.skills[this.aIndex].name;
				this.combatSpur.spd += buffVal;
				boostText += this.name + " gets +" + buffVal + " Spd from initiating with " + skillName + ".<br>";
			}
			if(this.has("Steady Blow")){
				buffVal = this.has("Steady Blow") * 2;
				skillName = data.skills[this.aIndex].name;
				this.combatSpur.spd += buffVal;
				boostText += this.name + " gets +" + buffVal + " Spd from initiating with " + skillName + ".<br>";
			}
			if(this.has("Swift Sparrow")){
				buffVal = this.has("Swift Sparrow") * 2;
				skillName = data.skills[this.aIndex].name;
				this.combatSpur.spd += buffVal;
				boostText += this.name + " gets +" + buffVal + " Spd from initiating with " + skillName + ".<br>";
			}
			if(this.has("Swift Strike")){
				buffVal = this.has("Swift Strike") * 2;
				skillName = data.skills[this.aIndex].name;
				this.combatSpur.spd += buffVal;
				boostText += this.name + " gets +" + buffVal + " Spd from initiating with " + skillName + ".<br>";
			}

			if(this.has("Armored Blow")){
				buffVal = this.has("Armored Blow") * 2;
				skillName = data.skills[this.aIndex].name;
				this.combatSpur.def += buffVal;
				boostText += this.name + " gets +" + buffVal + " Def from initiating with " + skillName + ".<br>";
			}
			if(this.has("Steady Blow")){
				buffVal = this.has("Steady Blow") * 2;
				skillName = data.skills[this.aIndex].name;
				this.combatSpur.def += buffVal;
				boostText += this.name + " gets +" + buffVal + " Def from initiating with " + skillName + ".<br>";
			}
			if(this.has("Sturdy Blow")){
				buffVal = this.has("Sturdy Blow") * 2;
				skillName = data.skills[this.aIndex].name;
				this.combatSpur.def += buffVal;
				boostText += this.name + " gets +" + buffVal + " Def from initiating with " + skillName + ".<br>";
			}
			if(this.has("Bracing Blow")){
				buffVal = this.has("Bracing Blow") * 2;
				skillName = data.skills[this.aIndex].name;
				this.combatSpur.def += buffVal;
				boostText += this.name + " gets +" + buffVal + " Def from initiating with " + skillName + ".<br>";
			}

			if(this.has("Warding Blow")){
				buffVal = this.has("Warding Blow") * 2;
				skillName = data.skills[this.aIndex].name;
				this.combatSpur.res += buffVal;
				boostText += this.name + " gets +" + buffVal + " Res from initiating with " + skillName + ".<br>";
			}
			if(this.has("Mirror Strike")){
				buffVal = this.has("Mirror Strike") * 2;
				skillName = data.skills[this.aIndex].name;
				this.combatSpur.res += buffVal;
				boostText += this.name + " gets +" + buffVal + " Res from initiating with " + skillName + ".<br>";
			}
			if(this.has("Swift Strike")){
				buffVal = this.has("Swift Strike") * 2;
				skillName = data.skills[this.aIndex].name;
				this.combatSpur.res += buffVal;
				boostText += this.name + " gets +" + buffVal + " Res from initiating with " + skillName + ".<br>";
			}
			if(this.has("Bracing Blow")){
				buffVal = this.has("Bracing Blow") * 2;
				skillName = data.skills[this.aIndex].name;
				this.combatSpur.res += buffVal;
				boostText += this.name + " gets +" + buffVal + " Res from initiating with " + skillName + ".<br>";
			}
			return boostText;
		}

		//Defensive Skills
		if(!this.initiator){
			//Not actually going to limit text from relevantDefType, because res/def may always be relevant for special attacks
			var buffVal = 0;

			//Skills
			if (this.hasAtIndex("Laws of Sacae", this.aIndex) && this.adjacent2 >= 2){
				buffVal = 4;
				skillName = data.skills[this.aIndex].name;
				this.combatSpur.atk += buffVal;
				this.combatSpur.spd += buffVal;
				this.combatSpur.def += buffVal;
				this.combatSpur.res += buffVal;
				boostText += this.name + " gets +" + buffVal + " Atk/Spd/Def/Res from being adjacent to >= 2 allies within 2 spaces with " + skillName + ".<br>";
			}

			//Close/Distant Def
			if(enemy.range == "ranged"){
				if(this.hasAtIndex("Distant Def", this.aIndex)){
					buffVal = this.hasAtIndex("Distant Def", this.aIndex) * 2;
					this.combatSpur.def += buffVal;
					this.combatSpur.res += buffVal;
					boostText += this.name + " gets +" + buffVal + " Def/Res from being attacked from range with " + data.skills[this.aIndex].name + ".<br>";
				}
				if(this.hasAtIndex("Distant Def", this.sIndex)){
					buffVal = this.hasAtIndex("Distant Def", this.sIndex) * 2;
					this.combatSpur.def += buffVal;
					this.combatSpur.res += buffVal;
					boostText += this.name + " gets +" + buffVal + " Def/Res from being attacked from range with " + data.skills[this.sIndex].name + " (Seal).<br>";
				}
				if(this.hasAtRefineIndex("Distant Def", this.refineIndex)){
					buffVal = 6;
					this.combatSpur.def += buffVal;
					this.combatSpur.res += buffVal;
					boostText += this.name + " gets +" + buffVal + " Def/Res from being attacked from range with " + data.skills[this.weaponIndex].name + " (Refined).<br>";
				}
			}
			if (enemy.range == "melee"){
				if (this.hasAtIndex("Close Def", this.aIndex)){
					buffVal = this.hasAtIndex("Close Def", this.aIndex) * 2;
					this.combatSpur.def += buffVal;
					this.combatSpur.res += buffVal;
					boostText += this.name + " gets +" + buffVal + " Def/Res from being attacked from melee with " + data.skills[this.aIndex].name + ".<br>";
				}
				if (this.hasAtIndex("Close Def", this.sIndex)){
					buffVal = this.hasAtIndex("Close Def", this.sIndex) * 2;
					this.combatSpur.def += buffVal;
					this.combatSpur.res += buffVal;
					boostText += this.name + " gets +" + buffVal + " Def/Res from being attacked from melee with " + data.skills[this.sIndex].name + " (Seal).<br>";
				}
			}

			//Weapons
			if (this.hasExactly("Binding Blade")){
				if (this.refineIndex == -1) {
					this.combatSpur.def += 2;
					this.combatSpur.res += 2;
					boostText += this.name + " gets +2 Def/Res while defending with " + data.skills[this.weaponIndex].name + ".<br>";
				} else {
					this.combatSpur.def += 4;
				    this.combatSpur.res += 4;
				    boostText += this.name + " gets +4 Def/Res while defending with " + data.skills[this.weaponIndex].name + ".<br>";
				}
			}
			if (this.hasExactly("Naga")){
				this.combatSpur.def += 2;
				this.combatSpur.res += 2;
				boostText += this.name + " gets +2 Def/Res while defending with " + data.skills[this.weaponIndex].name + ".<br>";
			}
			if (this.has("Sack o' Gifts") || this.has("Handbell") || this.has("Tannenboom!") || this.has("Candelabra")){
				this.combatSpur.atk += 2;
				this.combatSpur.spd += 2;
				this.combatSpur.def += 2;
				this.combatSpur.res += 2;
				boostText += this.name + " gets +2 Atk/Spd/Def/Res while defending with " + data.skills[this.weaponIndex].name + ".<br>";
			}
			if (this.hasExactly("Vidofnir")){
				let refinedVidofnir = data.refine[this.refineIndex] && data.refine[this.refineIndex].category == 'Vidofnir';
				if (refinedVidofnir && (enemy.weaponType == "sword" || enemy.weaponType == "axe" || enemy.weaponType == "lance"  || enemy.weaponType == "dragon" )) {
					this.combatSpur.def += 7;
					this.combatSpur.res += 7;
					boostText += this.name + " gets +7 Def/Res while defending with " + data.skills[this.weaponIndex].name + " against sword, axe, lance or dragon stone.<br>";
				}else if (enemy.weaponType == "sword" || enemy.weaponType == "axe" || enemy.weaponType == "lance" ) {
					this.combatSpur.def += 7;
					boostText += this.name + " gets +7 Def while defending with " + data.skills[this.weaponIndex].name + " against sword, axe, or lance.<br>";
				}
			}
			if (this.hasExactly("Close Stance")) {
				if (enemy.weaponType == "sword" || enemy.weaponType == "axe" || enemy.weaponType == "lance"  || enemy.weaponType == "dragon" ) {
					this.combatSpur.atk += 4;
					this.combatSpur.spf += 4;
					this.combatSpur.def += 4;
					this.combatSpur.res += 4;
					boostText += this.name + " gets +4 Atk/Spd/Def/Res while defending with " + data.skills[this.weaponIndex].name + " (Refined) against sword, axe, or lance or dragon stone.<br>";
				}
			}
			if (this.hasExactly("Tyrfing") && this.hp / this.maxHp <= 0.5){
				this.combatSpur.def += 4;
				boostText += this.name + " gets +4 Def in combat from " + data.skills[this.weaponIndex].name + " with <= 50% health.<br>";
			}
			if (this.has("Reprisal Lance")){
				this.combatSpur.atk += 6;
				boostText += this.name + " gets +6 Atk from defending with " + data.skills[this.weaponIndex].name + ".<br>";
			}
			if (this.has("Berkut's Lance")){
				if (this.hasExactly("Berkut's Lance+") && this.refineIndex != -1){
					this.combatSpur.res += 7;
					boostText += this.name + " gets +7 Res while defending with " + data.skills[this.weaponIndex].name + " (Refined).<br>";
				}
				else{
					this.combatSpur.res += 4;
					boostText += this.name + " gets +4 Res while defending with " + data.skills[this.weaponIndex].name + ".<br>";
				}
			}
			if (this.hasExactly("Bright Naginata")){
				this.combatSpur.atk += 4;
				this.combatSpur.def += 4;
				boostText += this.name + " gets +4 Atk/Def while defending with " + data.skills[this.weaponIndex].name + ".<br>";
			}
			if (this.has("Dauntless Stance")){
				this.combatSpur.spd += 4;
				this.combatSpur.def += 4;
				boostText += this.name + " gets +4 Spd/Def while defending with " + data.skills[this.weaponIndex].name + " (Refined).<br>";
			}
			if (this.has("Water Breath")){
				this.combatSpur.def += 4;
				this.combatSpur.res += 4;
				boostText += this.name + " gets +4 Def/Res while defending with " + data.skills[this.weaponIndex].name + ".<br>";
			}
			if (this.has("Guard Bow") && enemy.range == "ranged"){
				this.combatSpur.def += 6;
				this.combatSpur.res += 6;
				boostText += this.name + " gets +6 Def/Res while defending with " + data.skills[this.weaponIndex].name + " against a ranged opponent.<br>";
			}
			if (this.has("Blarserpent") && enemy.range == "ranged"){
				this.combatSpur.def += 6;
				this.combatSpur.res += 6;
				boostText += this.name + " gets +6 Def/Res while defending with " + data.skills[this.weaponIndex].name + " against a ranged opponent.<br>";
			}
			if (this.has("Safeguard")){
				buffVal = 7;
				this.combatSpur.def += buffVal;
				boostText += this.name + " gets +" + buffVal + " Def from defending with " + data.skills[this.weaponIndex].name + ".<br>";
			}
			if (this.has("Barrier Blade")){
				buffVal = 7;
				this.combatSpur.res += buffVal;
				boostText += this.name + " gets +" + buffVal + " Res from defending with " + data.skills[this.weaponIndex].name + ".<br>";
			}

			//Skills
			if(this.has("Fierce Breath")){
				this.combatSpur.atk += 4;
				boostText += this.name + " gets +4 Atk from defending with " + data.skills[this.aIndex].name + ".<br>";
			}
			if(this.has("Steady Breath")){
				this.combatSpur.def += 4;
				boostText += this.name + " gets +4 Def from defending with " + data.skills[this.aIndex].name + ".<br>";
			}
			if(this.has("Warding Breath")){
				this.combatSpur.res += 4;
				boostText += this.name + " gets +4 Res from defending with " + data.skills[this.aIndex].name + ".<br>";
			}
			if(this.hasAtIndex("Fierce Stance", this.aIndex)){
				buffVal = this.hasAtIndex("Fierce Stance", this.aIndex) * 2;
				this.combatSpur.atk += buffVal;
				boostText += this.name + " gets +" + buffVal + " Atk from defending with " + data.skills[this.aIndex].name + ".<br>";
			}
			if(this.hasAtIndex("Fierce Stance", this.sIndex)){
				buffVal = this.hasAtIndex("Fierce Stance", this.sIndex) * 2;
				this.combatSpur.atk += buffVal;
				boostText += this.name + " gets +" + buffVal + " Atk from defending with " + data.skills[this.sIndex].name + " (Seal).<br>";
			}
			if(this.hasAtIndex("Darting Stance", this.aIndex)){
				buffVal = this.hasAtIndex("Darting Stance", this.aIndex) * 2;
				this.combatSpur.spd += buffVal;
				boostText += this.name + " gets +" + buffVal + " Spd from defending with " + data.skills[this.aIndex].name + ".<br>";
            }
            if(this.hasAtIndex("Darting Stance", this.sIndex)){
				buffVal = this.hasAtIndex("Darting Stance", this.sIndex) * 2;
				this.combatSpur.spd += buffVal;
				boostText += this.name + " gets +" + buffVal + " Spd from defending with " + data.skills[this.sIndex].name + " (Seal).<br>";
			}
			if(this.has("Steady Stance")){
				buffVal = this.has("Steady Stance") * 2;
				this.combatSpur.def += buffVal;
				boostText += this.name + " gets +" + buffVal + " Def from defending with " + data.skills[this.aIndex].name + ".<br>";
			}
			if(this.has("Warding Stance")){
				buffVal = this.has("Warding Stance") * 2;
				this.combatSpur.res += buffVal;
				boostText += this.name + " gets +" + buffVal + " Res from defending with " + data.skills[this.aIndex].name + ".<br>";
			}
			if(this.has("Sturdy Stance")){
				buffVal = this.has("Sturdy Stance") * 2;
				this.combatSpur.atk += buffVal;
				this.combatSpur.def += buffVal;
				boostText += this.name + " gets +" + buffVal + " Atk/Def from defending with " + data.skills[this.aIndex].name + ".<br>";
			}
			if(this.has("Mirror Stance")){
				buffVal = this.has("Mirror Stance") * 2;
				this.combatSpur.atk += buffVal;
				this.combatSpur.res += buffVal;
				boostText += this.name + " gets +" + buffVal + " Atk/Res from defending with " + data.skills[this.aIndex].name + ".<br>";
			}
			if(this.has("Steady Posture")){
				buffVal = this.has("Steady Posture") * 2;
				this.combatSpur.spd += buffVal;
				this.combatSpur.def += buffVal;
				boostText += this.name + " gets +" + buffVal + " Spd/Def from defending with " + data.skills[this.aIndex].name + ".<br>";
			}
			if(this.has("Swift Stance")){
				buffVal = this.has("Swift Stance") * 2;
				this.combatSpur.spd += buffVal;
				this.combatSpur.res += buffVal;
				boostText += this.name + " gets +" + buffVal + " Spd/Res from defending with " + data.skills[this.aIndex].name + ".<br>";
			}
			if(this.has("Kestrel Stance")){
				buffVal = this.has("Kestrel Stance") * 2;
				this.combatSpur.atk += buffVal;
				this.combatSpur.spd += buffVal;
				boostText += this.name + " gets +" + buffVal + " Atk/Spd from defending with " + data.skills[this.aIndex].name + ".<br>";
			}
			if(this.has("Bracing Stance")){
				buffVal = this.has("Bracing Stance") * 2;
				this.combatSpur.def += buffVal;
				this.combatSpur.res += buffVal;
				boostText += this.name + " gets +" + buffVal + " Def/Res from defending with " + data.skills[this.aIndex].name + ".<br>";
			}
			if(this.has("Dragonskin")){
				buffVal = 4;
				this.combatSpur.def += buffVal;
				this.combatSpur.res += buffVal;
				boostText += this.name + " gets +" + buffVal + " Def/Res from defending with " + data.skills[this.aIndex].name + ".<br>";
			}
			if(this.hasExactly("Ostian Counter")){
				buffVal = 4;
				this.combatSpur.atk += buffVal;
				this.combatSpur.def += buffVal;
				boostText += this.name + " gets +" + buffVal + " Atk/Def from defending with " + data.skills[this.aIndex].name + ".<br>";
			}

			return boostText;
		}
	}

	//Calculates effective combat stats used within a round
	this.setCombatStats = function(enemy){
		var statText = "";
		var panicDebuff = {"atk":0,"spd":0,"def":0,"res":0};

		//Effective buff and debuff values
		this.combatBuffs.atk = Math.max(this.buffs.atk, this.combatBuffs.atk);
		this.combatBuffs.spd = Math.max(this.buffs.spd, this.combatBuffs.spd);
		this.combatBuffs.def = Math.max(this.buffs.def, this.combatBuffs.def);
		this.combatBuffs.res = Math.max(this.buffs.res, this.combatBuffs.res);
		this.combatDebuffs.atk = Math.min(this.debuffs.atk, this.combatDebuffs.atk);
		this.combatDebuffs.spd = Math.min(this.debuffs.spd, this.combatDebuffs.spd);
		this.combatDebuffs.def = Math.min(this.debuffs.def, this.combatDebuffs.def);
		this.combatDebuffs.res = Math.min(this.debuffs.res, this.combatDebuffs.res);

		//Harsh Command - turns regular debuffs into field buffs
		if (this.harshed){
			this.combatBuffs.atk = Math.max(-1 * this.combatDebuffs.atk, this.combatBuffs.atk);
			this.combatBuffs.spd = Math.max(-1 * this.combatDebuffs.spd, this.combatBuffs.spd);
			this.combatBuffs.def = Math.max(-1 * this.combatDebuffs.def, this.combatBuffs.def);
			this.combatBuffs.res = Math.max(-1 * this.combatDebuffs.res, this.combatBuffs.res);
			this.combatDebuffs = {"atk":0,"spd":0,"def":0,"res":0};
			statText += this.name + "'s debuffs are reversed by Harsh Command.<br>";
		}
		//Panic debuff - turns field buffs into specialized debuffs, can stack with regular debuffs(?)
		//TODO: Check if this debuff affects Blizzard
		if (this.panicked){
			panicDebuff.atk = this.combatBuffs.atk;
			panicDebuff.spd = this.combatBuffs.spd;
			panicDebuff.def = this.combatBuffs.def;
			panicDebuff.res = this.combatBuffs.res;
			this.combatBuffs = {"atk":0,"spd":0,"def":0,"res":0};
			statText += this.name + "'s buffs are reversed by panic debuff.<br>";
		//Buff cancelled - removes field buffs
		}else if (isBuffCancelled(this, enemy)){
			this.combatBuffs = {"atk":0,"spd":0,"def":0,"res":0};
			statText += this.name + "'s buffs are nullified by opponent's skill.<br>";
		}

		//Calculate effective combat stats
		//TODO: Check if stats can be negative
		this.combatStat.atk = Math.max(0, this.atk + this.combatBuffs.atk + this.combatDebuffs.atk - panicDebuff.atk);
		this.combatStat.spd = Math.max(0, this.spd + this.combatBuffs.spd + this.combatDebuffs.spd - panicDebuff.spd);
		this.combatStat.def = Math.max(0, this.def + this.combatBuffs.def + this.combatDebuffs.def - panicDebuff.def);
		this.combatStat.res = Math.max(0, this.res + this.combatBuffs.res + this.combatDebuffs.res - panicDebuff.res);

		return statText;
	}

	//Adds in-combat spurs and bonus into combat stats
	this.setCombatBonus = function(enemy){
		var statText = "";

		//TODO: Check if negative total buffs from field buffs affect this
		this.combatStat.atk = Math.max(0, this.combatStat.atk + this.spur.atk + this.combatSpur.atk);
		this.combatStat.spd = Math.max(0, this.combatStat.spd + this.spur.spd + this.combatSpur.spd);
		this.combatStat.def = Math.max(0, this.combatStat.def + this.spur.def + this.combatSpur.def);
		this.combatStat.res = Math.max(0, this.combatStat.res + this.spur.res + this.combatSpur.res);

		//Self Buff Atk bonus
		if (this.has("Raudrblade") 				|| this.has("Blarblade") 				|| this.has("Gronnblade")
			|| this.hasExactly("Thunderhead") 	|| this.hasExactly("Odin's Grimoire")	|| this.hasExactly("Laevatein")
		){
			var atkbonus = this.combatBuffs.atk + this.combatBuffs.spd + this.combatBuffs.def + this.combatBuffs.res;
			this.combatStat.atk += atkbonus;
			if (atkbonus != 0){statText += this.name + " gains +" + atkbonus + " Atk from buffs with " + data.skills[this.weaponIndex].name + ".<br>";}
		}
		//Enemy Debuff Atk bonus
		if (this.has("Blizzard")){
			var atkbonus = -1 * (enemy.combatDebuffs.atk + enemy.combatDebuffs.spd + enemy.combatDebuffs.def + enemy.combatDebuffs.res);
			this.combatStat.atk += atkbonus;
			if (atkbonus != 0){statText += this.name + " gains +" + atkbonus + " Atk from enemy penalties with " + data.skills[this.weaponIndex].name + ".<br>";}
		}
		//Enemy Buff Atk bonus
		if (this.hasExactly("The Cleaner") || this.hasExactly("Niu")){
			var atkbonus = enemy.combatBuffs.atk + enemy.combatBuffs.spd + enemy.combatBuffs.def + enemy.combatBuffs.res;
			if (this.hasExactly("Niu")){atkbonus = Math.floor(atkbonus/2);}
			this.combatStat.atk += atkbonus;
			if (atkbonus != 0){statText += this.name + " gains +" + atkbonus + " Atk from enemy buffs with " + data.skills[this.weaponIndex].name + ".<br>";}
		}

		return statText;
	}

	//poison only happens when the user initiates
	this.poisonEnemy = function(enemy){
		var poisonEnemyText ="";
		var skillName = "";

		if(!enemy.has("Embla's Ward")){
			var poison = 0;
			if(this.hasAtIndex("Poison Strike", this.bIndex)){
				poison = this.hasAtIndex("Poison Strike", this.bIndex)*3+1;
				skillName = data.skills[this.bIndex].name;
				if(enemy.hp - poison <= 0){
					poison = enemy.hp - 1;
				}
				enemy.hp -= poison;
				poisonEnemyText += enemy.name + " takes " + poison + " damage after combat from " + skillName + ".<br>";
			}
			if(this.hasAtIndex("Poison Strike", this.sIndex)){
				poison = this.hasAtIndex("Poison Strike", this.sIndex)*3+1;
				skillName = data.skills[this.sIndex].name;
				if(enemy.hp - poison <= 0){
					poison = enemy.hp - 1;
				}
				enemy.hp -= poison;
				poisonEnemyText += enemy.name + " takes " + poison + " damage after combat from " + skillName + " (Seal).<br>";
			}
			if(this.has("Deathly Dagger") && this.refineIndex == -1){
				poison = 7;
				skillName = data.skills[this.weaponIndex].name;
				if(enemy.hp - poison <= 0){
					poison = enemy.hp - 1;
				}
				enemy.hp -= poison;
				poisonEnemyText += enemy.name + " takes " + poison + " damage after combat from " + skillName + ".<br>";
			}
		}

		return poisonEnemyText;
	}


	//Pain and fury happen after every combat regardless of initiator
	//They could be put into one function, but separating them is easier to make sense of
	this.painEnemy = function(enemy){
		var painEnemyText = "";

		//Pain only takes place when the unit performs an attack in the round
		if(!enemy.has("Embla's Ward") && this.didAttack){
			var painDmg = 0;
			if(this.has("Pain") || (this.has("Deathly Dagger") && this.refineIndex != -1)
				){
				painDmg = 10;
				if(enemy.hp - painDmg <= 0){
					painDmg = enemy.hp - 1;
				}
				enemy.hp -= painDmg;
				painEnemyText += enemy.name + " takes " + painDmg + " damage after combat from " + data.skills[this.weaponIndex].name + (this.refineIndex != -1 ? " (Refined)" : "") + ".<br>";
			}
		}

		return painEnemyText;
	}

	//Damage after combat
	this.endCombatDamage = function(){
		var damageText = "";
		var skillName = "";
		var damage = 0;
		var totalDamage = 0;

		if(!this.has("Embla's Ward")){
			//Fury
			if(this.hasAtIndex("Fury", this.aIndex)){
				damage = this.hasAtIndex("Fury", this.aIndex) * 2;
				skillName = data.skills[this.aIndex].name;
				damageText += this.name + " takes " + damage + " damage after combat from " + skillName + ".<br>";
				totalDamage += damage;
			}
			if(this.hasAtRefineIndex("Fury", this.refineIndex)){
				damage = 6;
				skillName = data.skills[this.weaponIndex].name;
				damageText += this.name + " takes " + damage + " damage after combat from " + skillName + " (Refined).<br>";
				totalDamage += damage;
			}
			if(this.didAttack && this.hasExactly("Ragnarok") && this.refineIndex != -1){
				damage = 5;
				skillName = data.skills[this.weaponIndex].name;
				damageText += this.name + " takes " + damage + " damage after combat from " + skillName + " (Refined).<br>";
				totalDamage += damage;
			}

			//Cursed Lance
			if(this.has("Cursed Lance")){
				damage = 4;
				skillName = data.skills[this.weaponIndex].name;
				damageText += this.name + " takes " + damage + " damage after combat from " + skillName + ".<br>";
				totalDamage += damage;
			}

			//Activate only when attacking
			if(this.didAttack && this.combatStartHp / this.maxHp >= 1){
				//Weapons
				damage = 0;
				if (this.has("Seashell") || this.has("Refreshing Bolt") || this.has("Deft Harpoon") || this.has("Melon Crusher")){
					damage = 2;
				}
				if (this.hasExactly("Beloved Zofia")){
					damage = 4;
				}
				if (this.hasExactly("Ragnarok") && this.refineIndex == -1){
					damage = 5;
				}
				if (damage != 0){
					skillName = data.skills[this.weaponIndex].name;
					damageText += this.name + " takes " + damage + " damage after combat from attacking with " + skillName + ".<br>";
					totalDamage += damage;
				}

				//Skills
				damage = 0;
				if(this.hasAtIndex("Atk Spd Push", this.aIndex) 	|| this.hasAtIndex("Atk Def Push", this.aIndex) || this.hasAtIndex("Atk Res Push", this.aIndex)
					|| this.hasAtIndex("Spd Def Push", this.aIndex) || this.hasAtIndex("Spd Res Push", this.aIndex) || this.hasAtIndex("Def Res Push", this.aIndex)){
					skillName = data.skills[this.aIndex].name;
					damage = 1;
				}
				if (this.hasExactly("Double Lion") && this.initiator){
					skillName = data.skills[this.bIndex].name;
					damage = 1;
				}
				if (damage != 0){
					damageText += this.name + " takes " + damage + " damage after combat from attacking with " + skillName + ".<br>";
					totalDamage += damage;
				}

				//Refinement
				damage = 0;
				if (this.initiator && this.hasAtRefineIndex("Brave Falchion", this.refineIndex) && (this.combatStartHp / this.maxHp == 1)){
					damage = 5;
				}
				if (damage != 0){
					skillName = data.skills[this.weaponIndex].name;
					damageText += this.name + " takes " + damage + " damage after combat from initiating with " + skillName + " (Refined).<br>";
					totalDamage += damage;
				}
			}

			//Total
			if(totalDamage > 0){
				if(this.hp - totalDamage <= 0){
					totalDamage = this.hp - 1;
				}
				this.hp -= totalDamage;
			}
		}
		return damageText;
	}

	//After combat debuffs
	this.seal = function(enemy){
		var sealText = "";
		var sealValue = {"atk":0,"spd":0,"def":0,"res":0};
		var skillNames = [];

		//Seals stats for skill, can calculate up to two tiers
		function sealStats(skillName, statTypes, tierValue){
			//Check for second value
			if (tierValue.length == 2 && skillName.charAt(skillName.length - 1) == "+"){
				for (var i = 0; i < statTypes.length; i++){
					if (sealValue[statTypes[i]] > tierValue[1]){
						sealValue[statTypes[i]] = tierValue[1];
						if (!skillNames.includes(skillName)){
							skillNames.push(skillName);
						}
					}
				}
			//Otherwise just check for first value
			}else{
				for (var i = 0; i < statTypes.length; i++){
					if (sealValue[statTypes[i]] > tierValue[0]){
						sealValue[statTypes[i]] = tierValue[0];
						if (!skillNames.includes(skillName)){
							skillNames.push(skillName);
						}
					}
				}
			}
		}

		//Seals
		var debuffValue = 0;
		if (this.hasAtIndex("Seal Atk", this.bIndex)){
			debuffValue = -this.hasAtIndex("Seal Atk", this.bIndex) * 2 - 1;
			sealValue.atk = (sealValue.atk < debuffValue) ? sealValue.atk : debuffValue;
			skillNames.push(data.skills[this.bIndex].name);
		}
		if (this.hasAtIndex("Seal Atk", this.sIndex)){
			debuffValue = -this.hasAtIndex("Seal Atk", this.sIndex) * 2 - 1;
			sealValue.atk = (sealValue.atk < debuffValue) ? sealValue.atk : debuffValue;
			skillNames.push(data.skills[this.sIndex].name + " (Seal)");
		}
		if (this.hasAtIndex("Seal Spd", this.bIndex)){
			debuffValue = -this.hasAtIndex("Seal Spd", this.bIndex) * 2 - 1;
			sealValue.spd = (sealValue.spd < debuffValue) ? sealValue.spd : debuffValue;
			skillNames.push(data.skills[this.bIndex].name);
		}
		if (this.hasAtIndex("Seal Spd", this.sIndex)){
			debuffValue = -this.hasAtIndex("Seal Spd", this.sIndex) * 2 - 1;
			sealValue.spd = (sealValue.spd < debuffValue) ? sealValue.spd : debuffValue;
			skillNames.push(data.skills[this.sIndex].name + " (Seal)");
		}
		if (this.hasAtIndex("Seal Def", this.bIndex)){
			debuffValue = -this.hasAtIndex("Seal Def", this.bIndex) * 2 - 1;
			sealValue.def = (sealValue.def < debuffValue) ? sealValue.def : debuffValue;
			skillNames.push(data.skills[this.bIndex].name);
		}
		if (this.hasAtIndex("Seal Def", this.sIndex)){
			debuffValue = -this.hasAtIndex("Seal Def", this.sIndex) * 2 - 1;
			sealValue.def = (sealValue.def < debuffValue) ? sealValue.def : debuffValue;
			skillNames.push(data.skills[this.sIndex].name + " (Seal)");
		}
		if (this.hasAtIndex("Seal Res", this.bIndex)){
			debuffValue = -this.hasAtIndex("Seal Res", this.bIndex) * 2 - 1;
			sealValue.res = (sealValue.res < debuffValue) ? sealValue.res : debuffValue;
			skillNames.push(data.skills[this.bIndex].name);
		}
		if( this.hasAtIndex("Seal Res", this.sIndex)){
			debuffValue = -this.hasAtIndex("Seal Res", this.sIndex) * 2 - 1;
			sealValue.res = (sealValue.res < debuffValue) ? sealValue.res : debuffValue;
			skillNames.push(data.skills[this.sIndex].name + " (Seal)");
		}
		if (this.hasAtIndex("Seal Atk Spd", this.bIndex)){
			debuffValue = -this.hasAtIndex("Seal Atk Spd", this.bIndex) * 2 - 1;
			sealValue.atk = (sealValue.atk < debuffValue) ? sealValue.atk : debuffValue;
			sealValue.spd = (sealValue.spd < debuffValue) ? sealValue.spd : debuffValue;
			skillNames.push(data.skills[this.bIndex].name);
		}
		if (this.hasAtIndex("Seal Atk Def", this.bIndex)){
			debuffValue = -this.hasAtIndex("Seal Atk Def", this.bIndex) * 2 - 1;
			sealValue.atk = (sealValue.atk < debuffValue) ? sealValue.atk : debuffValue;
			sealValue.def = (sealValue.def < debuffValue) ? sealValue.def : debuffValue;
			skillNames.push(data.skills[this.bIndex].name);
		}
		if (this.hasAtIndex("Seal Def Res", this.bIndex)){
			debuffValue = -this.hasAtIndex("Seal Def Res", this.bIndex) * 2 - 1;
			sealValue.def = (sealValue.def < debuffValue) ? sealValue.def : debuffValue;
			sealValue.res = (sealValue.res < debuffValue) ? sealValue.res : debuffValue;
			skillNames.push(data.skills[this.bIndex].name);
		}

		//These only take effect if the unit performed an attack
		if (this.didAttack){
			//Staves
			if (this.has("Fear")){
				sealStats(data.skills[this.weaponIndex].name, ["atk"], [-6, -7]);
			}
			if (this.has("Slow")){
				sealStats(data.skills[this.weaponIndex].name, ["spd"], [-6, -7]);
			}

			//Daggers
			if (this.hasExactly("Deathly Dagger")){
				sealStats(data.skills[this.weaponIndex].name, ["def","res"], [-7]);
			}
			if (this.has("Silver Dagger") 		|| this.has("Seashell") 		|| this.has("Dancer's Fan") 	|| this.has("Kagami Mochi")
				|| this.has("Barb Shuriken") 	|| this.has("Lethal Carrot")	|| this.has("Starfish")		|| this.has("Bottled Juice")
				|| this.has("Cloud Maiougi")	|| this.has("Sky Maiougi")		|| this.has("Dusk Uchiwa")		|| this.has("Goodie Boot")
				){
				sealStats(data.skills[this.weaponIndex].name, ["def","res"], [-5, -7]);
			}
			if (this.has("Felicia's Plate") || this.has("Hoarfrost Knife")){
				sealStats(data.skills[this.weaponIndex].name, ["def","res"], [-7]);
			}
			if (this.has("Kitty Paddle") && (enemy.weaponType == "redtome" || enemy.weaponType == "bluetome" || enemy.weaponType == "greentome")){
				sealStats(data.skills[this.weaponIndex].name, ["def","res"], [-5, -7]);
			}
			if (this.has("Poison Dagger") && enemy.moveType == "infantry"){
				sealStats(data.skills[this.weaponIndex].name, ["def","res"], [-4, -6]);
			}
			if (this.has("Rogue Dagger")){
				sealStats(data.skills[this.weaponIndex].name, ["def","res"], [-3, -5]);
			}
			if (this.hasExactly("Rogue Dagger+") && this.refineIndex != -1){
				sealStats(data.skills[this.weaponIndex].name, ["def","res"], [-6]);
			}
			if (this.hasExactly("Iron Dagger") || this.hasExactly("Steel Dagger")){
				sealStats(data.skills[this.weaponIndex].name, ["def","res"], [-7]);
			}
			if (this.hasExactly("Peshkatz")){
				sealStats(data.skills[this.weaponIndex].name, ["atk","spd","def","res"], [-4]);
			}
			if (this.hasExactly("Smoke Dagger+") && this.refineIndex != -1){
				sealStats(data.skills[this.weaponIndex].name, ["atk","spd","def","res"], [-6]);
			}
			if (this.hasExactly("Sylgr")){
				sealStats(data.skills[this.weaponIndex].name, ["def","res"], [-7]);
			}
			if (this.hasExactly("Lyfjaberg")){
				sealStats(data.skills[this.weaponIndex].name, ["def","res"], [-7]);
			}

			//Other
			if (this.hasExactly("Grima's Truth")){
				sealStats(data.skills[this.weaponIndex].name, ["atk","spd"], [-5]);
			}
			if (this.hasExactly("Clarisse's Bow+") && this.refineIndex != -1){
				sealStats(data.skills[this.weaponIndex].name, ["atk","spd"], [-5]);
			}
			if (this.hasExactly("Dark Breath+") && this.refineIndex != -1){
				sealStats(data.skills[this.weaponIndex].name, ["atk","spd"], [-7]);
			}
			if (this.hasExactly("Hlidskjalf")){
				sealStats(data.skills[this.weaponIndex].name, ["atk","spd","def","res"], [-4]);
			}
		}

		//Set debuff values
		var statChanges = [];

		for (var stat in sealValue){
			if(sealValue[stat] < enemy.combatDebuffs[stat]){
				enemy.combatDebuffs[stat] = sealValue[stat];
				statChanges.push(enemy.combatDebuffs[stat] + " " + stat);
			}
		}

		if (skillNames.length > 0){
			if(statChanges.length > 0){
				sealText += this.name + " applies " + statChanges.join(",") + " on " + enemy.name + " with " + skillNames.join(", ") + ".<br>";
			}
		}

		return sealText;
	}

	//After combat buffs
	this.postCombatBuff = function(){
		var postCombatBuffText = "";
		var buffValue = {"atk":0,"spd":0,"def":0,"res":0};
		var skillNames = [];

		//Check and set highest buff value
		function buffStat(skillName, statTypes, value){
			for (var i = 0; i < statTypes.length; i++){
				if (buffValue[statTypes[i]] < value){
					buffValue[statTypes[i]] = value;
					if (!skillNames.includes(skillName)){
						skillNames.push(skillName);
					}
				}
			}
		}

		//Daggers only take effect if the unit performed an attack
		if (this.didAttack){
			if (this.hasExactly("Rogue Dagger+")){
				buffStat(data.skills[this.weaponIndex].name, ["def", "res"], 5);
			}
			else if (this.hasExactly("Rogue Dagger")){
				buffStat(data.skills[this.weaponIndex].name, ["def", "res"], 3);
			}

			if ((this.hasExactly("First Bite+") || this.hasExactly("Cupid's Arrow+") || this.hasExactly("Blessed Bouquet+")) && this.refineIndex != -1){
				buffStat(data.skills[this.weaponIndex].name + " (Refined)", ["def", "res"], 5);
			}

			if (this.hasExactly("Grima's Truth")){
				buffStat(data.skills[this.weaponIndex].name, ["atk", "spd"], 5);
			}
			if (this.hasExactly("Peshkatz")){
				buffStat(data.skills[this.weaponIndex].name, ["atk","spd","def","res"], 4);
			}
			if (this.hasExactly("Hlidskjalf")){
				buffStat(data.skills[this.weaponIndex].name, ["atk","spd","def","res"], 4);
			}
			if ((this.hasExactly("Light Breath+")) && this.refineIndex != -1){
				buffStat(data.skills[this.weaponIndex].name + " (Refined)", ["atk", "spd", "def", "res"], 5);
			}
			if (this.hasExactly("Fire Emblem") && this.triggered){
				buffStat(data.skills[this.specialIndex].name, ["atk","spd","def","res"], 4);
			}
		}

		//Set buff values
		var statChanges = [];

		for(var stat in buffValue){
			if(buffValue[stat] > this.combatBuffs[stat]){
				this.combatBuffs[stat] = buffValue[stat];
				statChanges.push("+" + this.combatBuffs[stat] + " " + stat);
			}
		}

		if(skillNames.length > 0){
			if(statChanges.length > 0){
				postCombatBuffText += this.name + " gains " + statChanges.join(",") + " with " + skillNames.join(", ") + ".<br>";
			}
		}


		//Post-combat buff for special triggered during combat
		if (this.triggered){
			var gainValue = 0;
			if (this.hasExactly("Dark Mystletainn")){
				gainValue = 2
				this.charge = this.charge + gainValue;
				postCombatBuffText += this.name + " gains " + gainValue + " extra charge from triggering a Special with " + data.skills[this.weaponIndex].name + ".<br>";
			}
			if (this.has("Special Spiral")){
				if (this.has("Special Spiral") != 1){
					gainValue = this.has("Special Spiral") - 1;
				}else if (this.challenger){
					gainValue = 1;
				}
				postCombatBuffText += this.name + " gains " + gainValue + " extra charge from triggering a Special with " + data.skills[this.bIndex].name + ".<br>";
			}
		}
		return postCombatBuffText;
	}

	//After combat heals
	this.postCombatHeal = function(){
		var postCombatHealText = "";
		var skillname = "";
		var healAmount = 0;

		if(this.has("Blue Egg") || this.has("Green Egg") || this.has("Carrot Axe") || this.has("Carrot Lance")){
			if(this.initiator || (this.refineIndex != -1 && this.didAttack)){
				skillName = data.skills[this.weaponIndex].name;
				healAmount = 4;
				if(this.maxHp - this.hp < healAmount){
					healAmount = this.maxHp - this.hp;
				}
				if(healAmount > 0){
					this.hp += healAmount;
					postCombatHealText += this.name + " heals " + healAmount + " Hp with " + skillName + ".<br>";
				}
			}
		}
		if(this.has("Mystic Boost")){
			skillName = data.skills[this.bIndex].name;
			healAmount = this.has("Mystic Boost") * 2;
			if(this.maxHp - this.hp < healAmount) {
				healAmount = this.maxHp - this.hp;
			}
			if(healAmount > 0){
				this.hp += healAmount;
				postCombatHealText += this.name + " heals " + healAmount + " Hp with " + skillName + ".<br>";
			}
		}

		return postCombatHealText;
	}

	this.takeDamage = function(dmg){
		//TODO: ?
	}

	//Checks if hero's buffs are cancelled by opponent
	function isBuffCancelled(hero, opponent){
		//Weapon
		if (opponent.hasExactly("Divine Naga")
			|| (opponent.hasExactly("Fensalir") && opponent.refineIndex != -1)
			){
			return true;
		}
		if ((opponent.has("Casa Blanca") || opponent.has("Green Gift") || opponent.has("Blue Gift") || opponent.has("Gratia")) && hero.range == "ranged"){
			return true;
		}
		//Refinement
		if (opponent.hasExactly("Nullify Armored") && hero.moveType == "armored"){
			return true;
		}
		if (opponent.hasExactly("Nullify Cavalry") && hero.moveType == "cavalry"){
			return true;
		}
		//Skill
		if (opponent.has("Beorc's Blessing") && (hero.moveType == "cavalry" || hero.moveType == "flying")){
			return true;
		}
		if (opponent.hasExactly("Mulagir") && (hero.weaponType == "redtome" || hero.weaponType == "bluetome" || hero.weaponType == "greentome")){
			return true;
		}
		if (opponent.has("Dull Ranged") && hero.range == "ranged"){
			if (opponent.has("Dull Ranged") == 3){
				return true;
			}else if (opponent.hp >= opponent.maxHp / opponent.has("Dull Ranged")){
				return true;
			}
		}
		if (opponent.has("Dull Close") && hero.range == "melee"){
			if (opponent.has("Dull Close") == 3){
				return true;
			}else if (opponent.hp >= opponent.maxHp / opponent.has("Dull Close")){
				return true;
			}
		}
		//Not cancelled
		return false;
	}

	//Check if hero has adaptive attack
	this.isAdaptive = function(enemy){
		if (!(
			enemy.has("Mystic Boost")
			|| (enemy.hasExactly("Unique Range Dragons") && this.weaponType == "dragon")
			|| (enemy.hasExactly("Divine Naga") && enemy.refineIndex != -1)
			)){
			if (this.hasExactly("Felicia's Plate")){
				return true;
			}
			if (this.has("Sorcery Blade") && this.adjacent >= 1) { // TODO: add adjacent MAGIC ally to UI and use this instead
				if (this.hasExactly("Sorcery Blade 1") && this.hp == this.maxHp){
					return true;
				}
				if (this.hasExactly("Sorcery Blade 2") && this.hp/this.maxHp >= .50){
					return true;
				}
				if (this.hasExactly("Sorcery Blade 3")){
					return true;
				}
			}
			if (enemy.range == "ranged"){
				if (this.hasExactly("Great Flame")		|| this.hasExactly("Expiration")		|| this.has("Water Breath")
					|| this.hasExactly("Breath of Fog")	|| this.hasExactly("Summer's Breath")	|| this.hasExactly("Breath of Blight")
					|| this.hasExactly("Divine Mist")	|| this.hasExactly("Spirit Breath")		|| this.hasExactly("Draconic Rage")
					|| this.has("Glittering Breath")
				){
					return true;
				}
				if (this.weaponType == "dragon" && (this.refineIndex != -1)){
					return true;
				}
			}
		}
		//Hero does not have adaptive attack
		return false;
	}

	//Return bonus damage for specials
	this.getBonusDamage = function(enemy){
		var damage = 0;
		var skillNames = [];

		//Weapons
		if (this.has("Wo Dao") 						|| this.has("Giant Spoon") 				|| this.has("Lethal Carrot")
			|| this.hasExactly("Dark Excalibur") 	|| this.hasExactly("Resolute Blade")	|| this.has("Harmonic Lance")
			|| this.has("Special Damage")			|| this.has("Wo Gun")
			|| (this.has("Berserk Armads") && (this.hp / this.maxHp <= .75))
			|| (this.has("Tome of Thoron") && (this.hp / this.maxHp <= .75))
		){
			damage += 10;
			skillNames.push(data.skills[this.weaponIndex].name);
		}
		//B Skills
		if (this.hasExactly("Bushido")
			|| (this.has("Wrath") && (this.hp / this.maxHp <= .25 * this.has("Wrath")))
		){
			damage += 10;
			skillNames.push(data.skills[this.bIndex].name);
		}
		if (this.hasExactly("Lunar Brace")){
			damage += Math.floor(enemy.combatStat.def / 2);
			skillNames.push(data.skills[this.bIndex].name);
		}

		return {"damage":damage, "skillNames":skillNames.join(", ").replace(/,(?!.*,)/gmi, ', and')};
	}

	//Return bonus flat damage
	this.getFlatBonus = function(enemy){
		var damage = 0;
		var skillNames = [];

		if (this.hasExactly("Light Brand")){
			if (enemy.combatStat.def >= enemy.combatStat.res + 5){
				damage += 7;
				skillNames.push(data.skills[this.weaponIndex].name);
			}
		}
		if (this.hasExactly("Vassal's Blade") || this.hasExactly("Giga Excalibur")){
			var damageBonus = Math.min((this.combatStat.spd + (this.has("Phantom Spd") ? (2 + this.has("Phantom Spd") * 3) : 0) - enemy.combatStat.spd) * 0.7 | 0, 7);
			if(damageBonus > 0){
				damage += damageBonus;
				skillNames.push(data.skills[this.weaponIndex].name);
			}
		}
		if (this.has("Shining Bow") && (enemy.combatStat.def >= enemy.combatStat.res + 5)){
			damage += 7;
			skillNames.push(data.skills[this.weaponIndex].name);
		}

		return {"damage":damage, "skillNames":skillNames.join(", ").replace(/,(?!.*,)/gmi, ', and')};
	}

	//represents one attack of combat
	this.doDamage = function(enemy, brave, AOE, firstAttack){
		//didAttack variable for checking daggers and pain
		this.didAttack = true;

		var enemyDefModifier = 0;
		var effectiveBonus = 1.0;
		var dmgMultiplier = 1.0;
		var dmgBoost = 0;
		var dmgBoostFlat = 0;
		var absorbPct = 0;

		var damageText = "";

		//Relevant defense stat
		var relevantDef = (this.attackType == "magical") ? enemy.combatStat.res : enemy.combatStat.def;

		//Check for adaptive attack
		if (this.isAdaptive(enemy)){
			relevantDef = (enemy.combatStat.def > enemy.combatStat.res) ? enemy.combatStat.res : enemy.combatStat.def;
			if (!AOE) {damageText += this.name + " is targeting foe's " + ((enemy.combatStat.def > enemy.combatStat.res) ? "Res" : "Def" ) + " with " + data.skills[hero.weapon].name + (this.refineIndex != -1 ? " (Refined)" : "") + ".<br>";}
		}

		//Offensive Specials
		var AOEActivated = false;
		var offensiveSpecialActivated = false;

		if (this.specialIndex != -1 && data.skills[this.specialIndex].charge <= this.charge){
			//Do AOE specials
			if (AOE){
				var AOEDamage = 0;

				if (this.has("Rising Thunder") || this.has("Rising Wind") || this.has("Rising Light") || this.has("Rising Flame") || this.has("Growing Thunder") || this.has("Growing Wind") || this.has("Growing Light") || this.has("Growing Flame")){
					AOEDamage = Math.max(0, this.combatStat.atk - relevantDef);
					AOEActivated = true;
				}else if (this.has("Blazing Thunder") || this.has("Blazing Wind") || this.has("Blazing Light") || this.has("Blazing Flame")){
					AOEDamage = Math.floor(1.5 * Math.max(0, this.combatStat.atk - relevantDef));
					AOEActivated = true;
				}

				if (AOEActivated){
					this.resetCharge();

					//Bonus Special Damage
					var bonusDamage = this.getBonusDamage(enemy);

					if (bonusDamage.damage != 0){
						AOEDamage += bonusDamage.damage;
						damageText += this.name + " gains " + bonusDamage.damage + " damage from " + bonusDamage.skillNames + ".<br>";
					}

					//Bonus Flat Damage
					var bonusFlatDamage = this.getFlatBonus(enemy);

					if (bonusFlatDamage.damage != 0){
						AOEDamage += bonusFlatDamage.damage;
						damageText += this.name + " gains " + bonusFlatDamage.damage + " damage from " + bonusFlatDamage.skillNames + ".<br>";
					}

					if (enemy.has("Embla's Ward")){
						AOEDamage = 0;
					}
					if (enemy.hp - AOEDamage < 1){
						AOEDamage = enemy.hp - 1;
					}

					enemy.hp -= AOEDamage;
					damageText += "Before combat, " + this.name + " hits " + enemy.name + " with " + data.skills[this.specialIndex].name + " for <span class=\"highlight\">" + AOEDamage + "</span> damage.<br>";
				}
			}
			else{
				//special will fire if it's an attacking special
				offensiveSpecialActivated = true;
				if (this.hasExactly("Night Sky") || this.hasExactly("Glimmer")){
					dmgMultiplier = 1.5;
				}else if (this.hasExactly("Astra")){
					dmgMultiplier = 2.5;
				}else if (this.hasExactly("Dragon Gaze") || this.hasExactly("Draconic Aura")){
					dmgBoost += this.combatStat.atk * 0.3;
				}else if (this.hasExactly("Dragon Fang")){
					dmgBoost += this.combatStat.atk * 0.5;
				}else if (this.hasExactly("Glowing Ember") || this.hasExactly("Bonfire")){
					dmgBoost += this.combatStat.def / 2;
				}else if (this.hasExactly("Ignis")){
					dmgBoost += this.combatStat.def * 0.8;
				}else if (this.hasExactly("Daylight") || this.hasExactly("Noontime")){
					absorbPct = 0.3;
				}else if (this.hasExactly("Sol")){
					absorbPct = 0.5;
				}else if (this.hasExactly("New Moon") || this.hasExactly("Moonbow")){
					enemyDefModifier = -0.3;
				}else if (this.hasExactly("Luna")){
					enemyDefModifier = -0.5;
				}else if (this.hasExactly("Black Luna")){
					enemyDefModifier = -0.8;
				}else if (this.hasExactly("Chilling Wind") || this.hasExactly("Iceberg")){
					dmgBoost += this.combatStat.res / 2;
				}else if (this.hasExactly("Glacies")){
					dmgBoost += this.combatStat.res * 0.8;
				}else if (this.hasExactly("Fire Emblem")){
					dmgBoost += this.combatStat.spd * 0.3;
				}else if (this.hasExactly("Regnal Astra")){
					dmgBoost += this.combatStat.spd * 0.4;
				}else if (this.hasExactly("Retribution") || this.hasExactly("Reprisal")){
					dmgBoost += (this.maxHp-this.hp) * 0.3;
				}else if (this.hasExactly("Vengeance")){
					dmgBoost += (this.maxHp-this.hp) * 0.5;
				}else if (this.hasExactly("Aether") || this.hasExactly("Radiant Aether")){
					enemyDefModifier = -0.5;
					absorbPct = 0.5;
				}else if (this.hasExactly("Blue Flame")){
					dmgBoost += (this.adjacent > 0 ? 25 : 10);
				}else{
					offensiveSpecialActivated = false;
				}
			}

			if (offensiveSpecialActivated){
				this.resetCharge();
				damageText += this.name + " activates " + data.skills[this.specialIndex].name + ".<br>";

				//Bonus Special Damage
				var bonusDamage = this.getBonusDamage(enemy);

				if (bonusDamage.damage != 0){
					dmgBoostFlat += bonusDamage.damage;
					damageText += this.name + " gains " + bonusDamage.damage + " damage from " + bonusDamage.skillNames + ".<br>";
				}

				//Solar Brace
				//***Does it activate with defensive specials? Does it stack with Absorb?***
				if (!AOE && this.hasExactly("Solar Brace")){
					damageText += this.name + "'s " + data.skills[this.bIndex].name + " restores an additional 30% of damage dealt.<br>";
					absorbPct += 0.3;
				}
			}
		}

		//Don't do anything else if it's just an AOE attack
		if (!AOE){
			//Check weapon advantage
			//0 is no advantage, 1 is attacker advantage, -1 is defender advantage
			var weaponAdvantage = 0;

			if ((enemy.color=="green"&&this.color=="red")||(enemy.color=="red"&&this.color=="blue")||(enemy.color=="blue"&&this.color=="green")){
				weaponAdvantage = 1;
			}
			else if (enemy.color=="gray" && (this.has("Raudrraven") || this.has("Blarraven") || this.has("Gronnraven") || this.has("Naglfar") || this.has("Tactical Bolt") || this.has("Tactical Gale"))){
				weaponAdvantage = 1;
			}
			else if ((this.color=="green"&&enemy.color=="red")||(this.color=="red"&&enemy.color=="blue")||(this.color=="blue"&&enemy.color=="green")){
				weaponAdvantage = -1;
			}
			else if (this.color=="gray" && (enemy.has("Raudrraven") || enemy.has("Blarraven") || enemy.has("Gronnraven") || enemy.has("Naglfar") || enemy.has("Tactical Bolt") || enemy.has("Tactical Gale"))){
				weaponAdvantage = -1;
			}

			//Extra weapon advantage is apparently limited to 0.2 more (doesn't stack)

			/*
			Cancel Affinity Rules for Attacker

			Attacker with Cancel Affinity:
				Attacker with Gem Weapon or Triangle Adept = no extra advantage or disadvantage

				Defender with:
					Advantaged Gem Weapon or Triangle Adept:									(Base -20%)
						Cancel Affinity 1 = negate extra disadvantage	(Extra -20% to 0%)		(Total -20%)
						Cancel Affinity 2 = negate extra disadvantage	(Extra -20% to 0%)		(Total -20%)
						Cancel Affinity 3 = reverse extra disadvantage	(Extra -20% to +20%)	(Total 0%)
					Disadvantaged Gem Weapon or Triangle Adept:									(Base +20%)
						Cancel Affinity 1 = negate extra advantage		(Extra +20% to 0%)		(Total +20%)
						Cancel Affinity 2 = keep extra advantage		(Extra +20% to +20%)	(Total +40%)
						Cancel Affinity 3 = keep extra advantage		(Extra +20% to +20%)	(Total +40%)

				Attacker with -raven Tome against Gray Defender:								(Base +20%)
					Attacker with Triangle Adept = no extra advantage or disadvantage			(Total +20%)
					Defender with Triangle Adept:
						Cancel Affinity 1 = negate extra advantage		(Extra +20% to 0%)		(Total +20%)
						Cancel Affinity 2 = keep extra advantage		(Extra +20% to +20%)	(Total +40%)
						Cancel Affinity 3 = keep extra advantage		(Extra +20% to +20%)	(Total +40%)

			Defender with Cancel Affinity:
				Attacker with:
					Advantaged Gem Weapon or Triangle Adept:									(Base +20%)
						Cancel Affinity 1 = negate extra disadvantage	(Extra +20% to 0%)		(Total +20%)
						Cancel Affinity 2 = negate extra disadvantage	(Extra +20% to 0%)		(Total +20%)
						Cancel Affinity 3 = reverse extra disadvantage	(Extra +20% to -20%)	(Total 0%)
					Disadvantaged Gem Weapon or Triangle Adept:									(Base -20%)
						Cancel Affinity 1 = negate extra advantage		(Extra -20% to 0%)		(Total -20%)
						Cancel Affinity 2 = keep extra advantage		(Extra -20% to -20%)	(Total -40%)
						Cancel Affinity 3 = keep extra advantage		(Extra -20% to -20%)	(Total -40%)

				Defender with Gem Weapon or Triangle Adept = no extra advantage or disadvantage

				Attacker with -raven Tome against Gray Defender:								(Base +20%)
					Attacker with Triangle Adept:
						Cancel Affinity 1 = negate extra disadvantage	(Extra +20% to 0%)		(Total +20%)
						Cancel Affinity 2 = negate extra disadvantage	(Extra +20% to 0%)		(Total +20%)
						Cancel Affinity 3 = reverse extra disadvantage	(Extra +20% to -20%)	(Total 0%)
					Defender with Triangle Adept = no extra advantage or disadvantage			(Total +20%)

			Attacker and Defender with Cancel Affinity:
				Attacker with Gem Weapon or Triangle Adept = no extra advantage or disadvantage
				Defender with Gem Weapon or Triangle Adept = no extra advantage or disadvantage
			*/

			var extraWeaponAdvantage = 0;
			var thisHasGemWeapon = (this.triangled || this.hasAtRefineIndex("Triangle Adept", this.refineIndex) || this.has("Ruby Sword") || this.has("Sapphire Lance") || this.has("Emerald Axe") || this.has("Draconic Poleax") || this.has("Whitewing Blade")) ? true : false;
			var enemyHasGemWeapon = (enemy.triangled || enemy.hasAtRefineIndex("Triangle Adept", enemy.refineIndex) || enemy.has("Ruby Sword") || enemy.has("Sapphire Lance") || enemy.has("Emerald Axe") || enemy.has("Draconic Poleax") || enemy.has("Whitewing Blade")) ? true : false;

			//If weapon advantage is not neutral, and Attacker and Defender do not both have Cancel Affinity
			if (weaponAdvantage !=0 && !(this.has("Cancel Affinity") && enemy.has("Cancel Affinity"))){

				//Calculate base weapon advantage bonus (Assume 0.2 is max.)
				if (thisHasGemWeapon || enemyHasGemWeapon){
					extraWeaponAdvantage = 0.2;
				}
				else{
					if (this.hasAtIndex("Triangle Adept", this.aIndex)){
						extraWeaponAdvantage = 0.05 + 0.05 * this.hasAtIndex("Triangle Adept", this.aIndex);
					}
					if (enemy.hasAtIndex("Triangle Adept", enemy.aIndex)){
						extraWeaponAdvantage = Math.max(extraWeaponAdvantage, 0.05 + 0.05 * enemy.hasAtIndex("Triangle Adept", enemy.aIndex));
					}
				}

				//If Attacker has Cancel Affinity
				if (this.has("Cancel Affinity")){

					//Attacker with Gem Weapon or Triangle Adept: No extra advantage or disadvantage
					if(thisHasGemWeapon || this.has("Triangle Adept")){
						extraWeaponAdvantage = 0;
					}

					//Defender with Gem Weapon or Triangle Adept
					if (enemyHasGemWeapon || enemy.has("Triangle Adept")){
						//Defender at disadvantage: Cancel Affinity 1 = negate, Cancel Affinity 2 = keep, Cancel Affinity 3 = keep
						if (weaponAdvantage == 1){
							if (this.has("Cancel Affinity 1")){
								extraWeaponAdvantage = 0;
							} else{
								if (enemyHasGemWeapon){
									extraWeaponAdvantage = 0.2;
								} else{
									extraWeaponAdvantage = 0.05 + 0.05 * enemy.hasAtIndex("Triangle Adept", enemy.aIndex);
								}
							}
						}
						//Defender at advantage: Cancel Affinity 1 = negate, Cancel Affinity 2 = negate, Cancel Affinity 3 = reverse
						//***Note the double negative for weaponAdvantageBonus formula***
						else{
							if (this.has("Cancel Affinity 3")){
								if (enemyHasGemWeapon){
									extraWeaponAdvantage = -0.2;
								} else{
									extraWeaponAdvantage = (0.05 + 0.05 * enemy.hasAtIndex("Triangle Adept", enemy.aIndex)) * -1;
								}
							} else{
								extraWeaponAdvantage = 0;
							}
						}
					}
				}
				//If Defender has Cancel Affinity
				else if (enemy.has("Cancel Affinity")){

					//Defender with Gem Weapon or Triangle Adept: No extra advantage or disadvantage
					if(enemyHasGemWeapon || enemy.has("Triangle Adept")){
						extraWeaponAdvantage = 0;
					}

					//Attacker with Gem Weapon or Triangle Adept
					if(thisHasGemWeapon || this.has("Triangle Adept")){
						//Attacker at advantage: Cancel Affinity 1 = negate, Cancel Affinity 2 = negate, Cancel Affinity 3 = reverse
						if (weaponAdvantage == 1){
							if (enemy.has("Cancel Affinity 3")){
								if (thisHasGemWeapon){
									extraWeaponAdvantage = -0.2;
								} else{
									extraWeaponAdvantage = (0.05 + 0.05 * this.has("Triangle Adept")) * -1;
								}
							} else{
								extraWeaponAdvantage = 0;
							}
						}
						//Attacker at disadvantage: Cancel Affinity 1 = negate, Cancel Affinity 2 = keep, Cancel Affinity 3 = keep
						else{
							if (enemy.has("Cancel Affinity 1")){
								extraWeaponAdvantage = 0;
							} else{
								if (thisHasGemWeapon){
									extraWeaponAdvantage = 0.2;
								} else{
									extraWeaponAdvantage = 0.05 + 0.05 * this.has("Triangle Adept");
								}
							}
						}
					}
				}
			}

			/*
			***Old Weapon Advantage Script***
			if(weaponAdvantage != 0){
				if(this.has("Ruby Sword") || this.has("Sapphire Lance") || this.has("Emerald Axe") || enemy.has("Ruby Sword") || enemy.has("Sapphire Lance") || enemy.has("Emerald Axe")){
					extraWeaponAdvantage = 0.2;
				}
				else{
					if(this.has("Triangle Adept")){
						extraWeaponAdvantage = 0.05 + 0.05 * this.has("Triangle Adept");
					}
					if(enemy.has("Triangle Adept")){
						extraWeaponAdvantage = Math.max(extraWeaponAdvantage,0.05 + 0.05 * enemy.has("Triangle Adept"));
					}
				}
			}
			*/

			var weaponAdvantageBonus = (0.2 + extraWeaponAdvantage) * weaponAdvantage;

			if(weaponAdvantage != 0){
				if (weaponAdvantageBonus == 0){
					damageText += this.name + "'s weapon " + ((weaponAdvantage == 1) ? "advantage" : "disadvantage") + " is negated by Cancel Affinity.<br>";
				}
				else{
					damageText += this.name + "'s attack is multiplied by " + Math.round((1+weaponAdvantageBonus)*10)/10 + " because of weapon " + ((weaponAdvantage == 1) ? "advantage" : "disadvantage") + ".<br>";
				}
			}

			//Check weapon effective against
			var effectiveBonus = 1;
			if (enemy.moveType == "armored"
				&& (this.has("Hammer") 						|| this.has("Slaying Hammer")	|| this.has("Armorslayer") 				|| this.has("Armorsmasher")
					|| this.has("Heavy Spear") 				|| this.has("Slaying Spear")	|| this.hasExactly("Thani")				|| this.hasExactly("Winged Sword")
					|| this.hasExactly("Warrior Princess")	|| this.hasExactly("Rhomphaia")	|| this.hasExactly("Dauntless Lance")	|| this.hasExactly("Dawn Suzu")
					|| this.hasExactly("Florina's Lance")	|| this.has("Sky Maiougi") 		|| this.hasExactly("Whitewing Spear")	|| this.hasExactly("Axe of Virility")
				)
			){
				effectiveBonus = (enemy.has("Svalinn Shield")) ? 1 : 1.5;
			}
			else if (enemy.moveType == "flying" && (this.hasExactly("Excalibur") || this.weaponType=="bow")){
				effectiveBonus = (enemy.has("Iote's Shield") || enemy.has("Dragonskin")) ? 1 : 1.5;
			}
			else if (enemy.moveType == "infantry" && (this.has("Poison Dagger"))){
				effectiveBonus = 1.5;
			}
			else if (enemy.moveType == "cavalry"
				&& (this.has("Zanbato") 			|| this.has("Ridersbane")			|| this.has("Poleaxe")
					|| this.has("Raudrwolf") 		|| this.has("Blarwolf") 			|| this.has("Gronnwolf")
					|| this.hasExactly("Thani")		|| this.hasExactly("Winged Sword")	|| this.hasExactly("Rhomphaia")
					|| this.hasExactly("Dawn Suzu")	|| this.has("Dusk Uchiwa")
				)
			){
				effectiveBonus = (enemy.has("Grani's Shield")) ? 1 : 1.5;
			}
			else if ((enemy.weaponType == "dragon" || enemy.hasExactly("Loptous")) && isDragonEffective(this)){
				effectiveBonus = (enemy.has("Breath of Blight")) ? 1 : 1.5;
			}
			else if ((enemy.weaponType == "redtome" || enemy.weaponType == "bluetome" || enemy.weaponType == "greentome") && (this.has("Kitty Paddle"))){
				effectiveBonus = 1.5;
			}

			if (effectiveBonus > 1){
				damageText += this.name + "'s attack is increased by " + (effectiveBonus * 100 - 100) + "% from weapon effectiveness.<br>";
			}

			//Flat damage
			//*** Is Light Brand damage bonus flat damage or bonus attack? ***
			var bonusFlatDamage = this.getFlatBonus(enemy);

			if (bonusFlatDamage.damage != 0){
				dmgBoostFlat += bonusFlatDamage.damage;
				damageText += this.name + " gains " + bonusFlatDamage.damage + " damage from " + bonusFlatDamage.skillNames + ".<br>";
			}

			//Release charged damage
			if (this.chargedDamage > 0){
				dmgBoostFlat += this.chargedDamage;
				damageText += this.name + " gains " + this.chargedDamage + " damage from releasing stored energy.<br>";
				this.chargedDamage = 0;
			}

			//Class modifier
			var weaponModifier = 1;
			//Healers
			if(this.weaponType == "staff"){
				weaponModifier = 0.5;
				//Wrathful effects
				if (this.hasExactly("Thokk")){
					weaponModifier = 1;
				}
				if (this.has("Wrathful Staff")){
					if(this.combatStartHp / this.maxHp >= 1.5 + this.has("Wrathful Staff") * -0.5){
						weaponModifier = 1;
					}
				}
				if (this.hasExactly("Wrathful")){
					weaponModifier = 1;
				}
			}

			//Check damage reducing specials and effects
			var defensiveSpecialActivated = false;
			var dmgReduction = 1.0;
			var dmgReductionFlat = 0;
			var miracle = false;

			//First Attack
			if (firstAttack){
				//Weapon
				if (enemy.hasExactly("Divine Tyrfing") && (this.weaponType == "redtome" || this.weaponType == "bluetome" || this.weaponType == "greentome")){
					dmgReduction *= 0.5;
					damageText += enemy.name + "'s Divine Tyrfing reduces " + this.name + "'s magic damage by 50%.<br>";
				}
				if (enemy.hasExactly("Thani") && (this.moveType == "armored" || this.moveType == "cavalry") && (this.range == "ranged")){
					dmgReduction *= 0.7;
					damageText += enemy.name + "'s Thani reduces " + this.name + "'s damage by 30%.<br>";
				}
				//Refinement
				if (enemy.hasExactly("Brynhildr") && enemy.refineIndex != -1 && (this.weaponType == "redtome" || this.weaponType == "bluetome" || this.weaponType == "greentome")){
					dmgReduction *= 0.7;
					damageText += enemy.name + "'s Brynhildr (Refined) reduces " + this.name + "'s magic damage by 30%.<br>";
				}
				if (enemy.hasExactly("Parthia") && enemy.refineIndex != -1 && (this.weaponType == "redtome" || this.weaponType == "bluetome" || this.weaponType == "greentome")){
					dmgReduction *= 0.7;
					damageText += enemy.name + "'s Parthia (Refined) reduces " + this.name + "'s magic damage by 30%.<br>";
				}
			}

			//Consecutive Attack
			if (lastAttacker == this.name){
				//Weapon
				if (enemy.hasExactly("Urvan")){
					dmgReduction *= 0.2;
					damageText += enemy.name + "'s Urvan reduces " + this.name + "'s consecutive damage by 80%.<br>";
				}
				if (enemy.hasExactly("Crusader's Ward") && this.range == "ranged"){
					dmgReduction *= 0.2;
					damageText += enemy.name + "'s Crusader's Ward reduces " + this.name + "'s consecutive damage by 80%.<br>";
				}

				//Deflect Seals
				var deflect = 0;
				if (enemy.has("Deflect Magic") && (this.weaponType == "redtome" || this.weaponType == "bluetome" || this.weaponType == "greentome")){
					deflect = enemy.has("Deflect Magic");
				}else if (enemy.has("Deflect Melee") && this.attackType == "physical" && this.range == "melee"){
					deflect = enemy.has("Deflect Melee");
				}else if (enemy.has("Deflect Missile") && this.attackType == "physical" && this.range == "ranged"){
					deflect = enemy.has("Deflect Missile");
				}
				if (deflect != 0){
					switch (deflect){
						case 1:
							dmgReduction *= 0.7;
							damageText += enemy.name + "'s " + data.skills[enemy.sIndex].name + " reduces " + this.name + "'s consecutive damage by 30%.<br>";
							break;
						case 2:
							dmgReduction *= 0.5;
							damageText += enemy.name + "'s " + data.skills[enemy.sIndex].name + " reduces " + this.name + "'s consecutive damage by 50%.<br>";
							break;
						case 3:
							dmgReduction *= 0.2;
							damageText += enemy.name + "'s " + data.skills[enemy.sIndex].name + " reduces " + this.name + "'s consecutive damage by 80%.<br>";
							break;
						default:
							damageText += "Error: Invalid 'deflect' value.";
							break;
					}
				}
			}

			if(enemy.specialIndex != -1 && data.skills[enemy.specialIndex].charge <= enemy.charge){
				//gotta check range
				var anyRangeCounter = canCounterAnyRange(this);

				if(this.hasExactly("Unique Range Special Wait") && (this.specialIndex != -1 && data.skills[this.specialIndex].charge <= this.charge)){
					anyRangeCounter = true
				}
				if(this.hasExactly("Unique Range Dragon") && enemy.weaponType == "dragon"){
					anyRangeCounter = true
				}

				if(this.range == "melee" || (!this.initiator && enemy.range == "melee" && anyRangeCounter)){
					if(enemy.has("Buckler") || enemy.has("Escutcheon")){
						dmgReduction *= 0.7;
						defensiveSpecialActivated = true;
						damageText += enemy.name + " activates " + data.skills[enemy.specialIndex].name + " and reduces " + this.name + "'s damage by 30%.<br>";
					}
					else if(enemy.has("Pavise")){
						dmgReduction *= 0.5;
						defensiveSpecialActivated = true;
						damageText += enemy.name + " activates " + data.skills[enemy.specialIndex].name + " and reduces " + this.name + "'s damage by 50%.<br>";
					}
				}
				else if(this.range == "ranged" || (!this.initiator && enemy.range == "ranged" && anyRangeCounter)){
					if(enemy.has("Holy Vestments") || enemy.has("Sacred Cowl") || enemy.has("Ice Mirror")){
						dmgReduction *= 0.7;
						defensiveSpecialActivated = true;
						damageText += enemy.name + " activates " + data.skills[enemy.specialIndex].name + " and reduces " + this.name + "'s damage by 30%.<br>";
					}
					else if(enemy.has("Aegis")){
						dmgReduction *= 0.5;
						defensiveSpecialActivated = true;
						damageText += enemy.name + " activates " + data.skills[enemy.specialIndex].name + " and reduces " + this.name + "'s damage by 50%.<br>";
					}
				}

				if(enemy.has("Miracle") && enemy.hp > 1){
					miracle = true;
				}
			}

			if(enemy.hasExactly("Tyrfing") && enemy.refineIndex != -1){
				if(enemy.combatStartHp / enemy.maxHp >= 0.5 && enemy.hp > 1){
					miracle = true;	
				}				
			}

			//Before damage defensive special effects
			if (defensiveSpecialActivated){
				//Shield Pulse flat damage reduction check
				if (dmgReduction < 1){
					if (enemy.has("Shield Pulse 2") || enemy.has("Shield Pulse 3")){
						dmgReductionFlat += 5;
						damageText += enemy.name + "'s Shield Pulse reduces " + this.name + "'s damage by an additional 5.<br>";
					}
				}
			}

			//Absorb check
			if (this.has("Absorb")){
				absorbPct = 0.5;
			}

			//Defensive Terrain
			var enemyDefensive = enemy.challenger ? options.defensive_challenger : options.defensive_enemy;
			if (enemyDefensive){
				enemyDefModifier += 0.3;
				damageText += enemy.name + " reduces 30% damage from being on defensive terrain.<br>";
			}

			//Damage calculation from http://feheroes.wiki/Damage_Calculation
			//use bitwise or to truncate properly
			//Doing calculation in steps to see the formula more clearly
			var rawDmg = (this.combatStat.atk * effectiveBonus | 0);
			var advBoost = ((this.combatStat.atk * effectiveBonus | 0) * weaponAdvantageBonus | 0);
			var statBoost = dmgBoost;
			var reduceDmg = relevantDef + (relevantDef * enemyDefModifier | 0);

			//Total damage = base damage + weapon advantage boost + stat-reliant special boost - relevant defense mitigation (should not be reduced below 0)
			var totalDmg = Math.max(0, rawDmg + advBoost + statBoost - reduceDmg);
			//Total damage is modified by weapon modifier (ie. healer staff reduction)
			totalDmg = (totalDmg * weaponModifier | 0);
			//Total damage is modified by damage multiplier from specials + flat damage bonus
			totalDmg = (totalDmg * dmgMultiplier | 0) + dmgBoostFlat;
			//Final damage is total damage - damage reduction from specials - flat damage reduction (should not be reduced below 0)
			var dmg = Math.max(0, totalDmg - (totalDmg * (1 - dmgReduction) | 0) - dmgReductionFlat);

			/*	Old damage formula
			var rawDmg = (this.combatStat.atk * effectiveBonus | 0) + ((this.combatStat.atk * effectiveBonus | 0) * weaponAdvantageBonus | 0) + (dmgBoost | 0);
			var reduceDmg = relevantDef + (relevantDef * enemyDefModifier | 0);
			var dmg = (rawDmg - reduceDmg) * weaponModifier | 0;
			dmg = dmg * dmgMultiplier | 0;
			dmg -= dmg * (1 - dmgReduction) | 0;
			dmg -= dmgReductionFlat | 0;
			*/

			if(enemy.has("Embla's Ward")){
				dmg = 0;
			}

			damageText += this.name + " attacks " + enemy.name + " for <span class=\"highlight\">" + dmg + "</span> damage.<br>";

			//After damage defensive special effects
			if(defensiveSpecialActivated){
				//Ice Mirror damage charge up check
				if (enemy.has("Ice Mirror")){
					var iceMirrorDamage = totalDmg - dmg;
					if (iceMirrorDamage > 0){
						enemy.chargedDamage += iceMirrorDamage;
						damageText += enemy.name + "'s Ice Mirror stores " + iceMirrorDamage + " damage for next attack.<br>";
					}
				}
				//Reset enemy charge after special activation
				enemy.resetCharge();
			}

			//Miracle survival check
			if(dmg >= enemy.hp){
				if(miracle){
					dmg = enemy.hp - 1;
					defensiveSpecialActivated = true;
					enemy.resetCharge();
					damageText += enemy.name + " survives with 1 HP with Miracle.<br>";
				}
				else{
					enemy.overkill = dmg - enemy.hp;
					dmg = Math.min(dmg,enemy.hp);
				}
			}
			enemy.hp -= dmg;

			//Set this attacker as last attacker for Urvan check
			//Initiator vs defender differentiated when name was assigned
			lastAttacker = this.name;

			//add absorbed hp
			var absorbHp = dmg*absorbPct | 0;
			if(this.hp + absorbHp > this.maxHp){
				absorbHp = this.maxHp - this.hp;
			}
			this.hp += absorbHp;
			if(absorbHp > 0){
				damageText += this.name + " absorbs " + absorbHp + " health.<br>";
			}

			//Charge changes for attacker
			//***Special charge does not increase if special was used on this attack***
			//TODO: This area is really confusing with duplicate code for !offensiveSpecialActivated, !defenseSpecialActivated, initator, and !initiator.
			//		Clean or add better annotation.
			if (!offensiveSpecialActivated){
				var gainCharge = 0;	//For possible >1 gains
				var loseCharge = 0;
				var skillNames = [];

				if (!this.initiator && this.has("Summer's Breath")){
					gainCharge = Math.max(gainCharge, 1);
					skillNames.push(data.skills[this.weaponIndex].name);
				}
				if (!this.initiator && this.has("Fierce Breath")){
					gainCharge = Math.max(gainCharge, 1);
					skillNames.push(data.skills[this.aIndex].name);
				}
				if (!this.initiator && this.has("Steady Breath")){
					gainCharge = Math.max(gainCharge, 1);
					skillNames.push(data.skills[this.aIndex].name);
				}
				if (!this.initiator && this.has("Warding Breath")){
					gainCharge = Math.max(gainCharge, 1);
					skillNames.push(data.skills[this.aIndex].name);
				}
				if (!this.initiator && this.has("Vengeful Fighter")){
					if (this.combatStartHp / this.maxHp >= (1.0 - (this.hasAtIndex("Vengeful Fighter", this.bIndex) * 0.1) - ((this.hasAtIndex("Vengeful Fighter", this.bIndex) - 1) * 0.1))){
						gainCharge = Math.max(gainCharge, 1);
						skillNames.push(data.skills[this.bIndex].name);
					}
				}
				if (this.initiator && this.has("Bold Fighter")){
					if (this.hasAtIndex("Bold Fighter", this.bIndex) == 3 || this.combatStartHp / this.maxHp >= 1.0 / this.hasAtIndex("Bold Fighter", this.bIndex)){
						gainCharge = Math.max(gainCharge, 1);
						skillNames.push(data.skills[this.bIndex].name);
					}
				}
				//TODO: Change Rush skill name to a generic name
				if (this.rushed){
					if (this.combatStat.atk - enemy.combatStat.atk >= 1){
						gainCharge = Math.max(gainCharge, 1);
						skillNames.push("Infantry Rush 3");
					}
				}
				if (this.hasAtIndex("Heavy Blade", this.aIndex)){
					if (this.combatStat.atk - enemy.combatStat.atk >= 7 - (this.hasAtIndex("Heavy Blade", this.aIndex) * 2)){
						gainCharge = Math.max(gainCharge, 1);
						skillNames.push(data.skills[this.aIndex].name);
					}
				}
				if (this.hasAtIndex("Heavy Blade", this.sIndex)){
					if (this.combatStat.atk - enemy.combatStat.atk >= 7 - (this.hasAtIndex("Heavy Blade", this.sIndex) * 2)){
						gainCharge = Math.max(gainCharge, 1);
						skillNames.push(data.skills[this.sIndex].name + " (Seal)");
					}
				}
				if (this.hasExactly("Gladiator's Blade")){
					if (this.combatStat.atk- enemy.combatStat.atk >= 1){
						gainCharge = Math.max(gainCharge, 1);
						skillNames.push(data.skills[this.weaponIndex].name);
					}
				}
				if (this.hasExactly("Blazing Durandal")){
					if (this.combatStat.atk - enemy.combatStat.atk >= 1){
						gainCharge = Math.max(gainCharge, 1);
						skillNames.push(data.skills[this.weaponIndex].name);
					}
				}
				if (this.flashed && this.moveType == "infantry"){
					if (this.combatStat.spd + (this.has("Phantom Spd") ? (2 + this.has("Phantom Spd") * 3) : 0) - enemy.combatStat.spd >= 1){
						gainCharge = Math.max(gainCharge, 1);
						skillNames.push("Infantry Flash 3");
					}
				}
				if (this.hasAtIndex("Flashing Blade", this.aIndex)){
					if (this.combatStat.spd + (this.has("Phantom Spd") ? (2 + this.has("Phantom Spd") * 3) : 0) - enemy.combatStat.spd >= 7 - (this.hasAtIndex("Flashing Blade", this.aIndex) * 2)){
						gainCharge = Math.max(gainCharge, 1);
						skillNames.push(data.skills[this.aIndex].name);
					}
				}
				if (this.hasAtIndex("Flashing Blade", this.sIndex)){
					if (this.combatStat.spd + (this.has("Phantom Spd") ? (2 + this.has("Phantom Spd") * 3) : 0) - enemy.combatStat.spd >= 7 - (this.hasAtIndex("Flashing Blade", this.sIndex) * 2)){
						gainCharge = Math.max(gainCharge, 1);
						skillNames.push(data.skills[this.sIndex].name + " (Seal)");
					}
				}
				if (this.hasAtRefineIndex("Flashing Blade", this.refineIndex)){
					if (this.combatStat.spd + (this.has("Phantom Spd") ? (2 + this.has("Phantom Spd") * 3) : 0) - enemy.combatStat.spd >= 1){
						gainCharge = Math.max(gainCharge, 1);
						skillNames.push(data.skills[this.weaponIndex].name + " (Refined)");
					}
				}
				if (this.hasExactly("Ayra's Blade")){
					if (this.combatStat.spd + (this.has("Phantom Spd") ? (2 + this.has("Phantom Spd") * 3) : 0) - enemy.combatStat.spd >= 1){
						gainCharge = Math.max(gainCharge, 1);
						skillNames.push(data.skills[this.weaponIndex].name);
					}
				}
				if (this.hasExactly("Royal Sword") && this.adjacent > 0){
					gainCharge = Math.max(gainCharge, 1);
					skillNames.push(data.skills[this.weaponIndex].name);
				}
				if (this.hasExactly("Storm Sieglinde") && (this.adjacent2_foe - 1 >= this.adjacent2)){
					gainCharge = Math.max(gainCharge, 1);
					skillNames.push(data.skills[this.weaponIndex].name);
				}
				if (this.hasAtRefineIndex("Magic Absorption", this.refineIndex)){
					if (enemy.weaponType == "redtome" || enemy.weaponType == "bluetome" || enemy.weaponType == "greentome"){
						gainCharge = Math.max(gainCharge, 1);
						skillNames.push(data.skills[this.weaponIndex].name + " (Refined)");
					}
				}
				if (this.has("Special Fighter")){
					if (this.combatStartHp/this.maxHp >= 1.1 - this.has("Special Fighter") * 0.2){
						gainCharge = Math.max(gainCharge, 1);
						skillNames.push(data.skills[this.bIndex].name);
					}
				}

				if (gainCharge > 0){
					this.charge += gainCharge;
					damageText += this.name + " gains " + gainCharge + " charge with " + skillNames.join(", ") + ".<br>";
				}

				//Reset skillNames
				skillNames = [];

				if (enemy.hasAtIndex("Guard", enemy.bIndex)){
					if (enemy.combatStartHp / enemy.maxHp >= 1.1 - enemy.hasAtIndex("Guard", enemy.bIndex) * 0.1){
						loseCharge = Math.max(loseCharge, 1);
						skillNames.push(data.skills[enemy.bIndex].name);
					}
				}
				if (enemy.has("Devilish Bow") || enemy.has("Bottled Juice") || enemy.has("Hack-o'-Lantern+")){
					loseCharge = Math.max(loseCharge, 1);
					skillNames.push(data.skills[enemy.weaponIndex].name);
				}
				if (enemy.has("Special Fighter")){
					if (enemy.combatStartHp/enemy.maxHp >= 1.1 - enemy.has("Special Fighter") * 0.2){
						loseCharge = Math.max(loseCharge, 1);
						skillNames.push(data.skills[enemy.bIndex].name);
					}
				}
				if (!enemy.initiator && enemy.hasExactly("Steady Stance 4")){
					loseCharge = Math.max(loseCharge, 1);
					skillNames.push(data.skills[enemy.aIndex].name);
				}

				if (loseCharge > 0){
					this.charge -= loseCharge;
					damageText += this.name + " loses " + loseCharge + " charge due to " + skillNames.join(", ") + ".<br>";
				}

				//Attacker gains a charge after attacking
				if (!this.bewitched){
					this.charge++;
				} else{
					damageText += this.name + " gains no charge from attacking due to Witchy Wand debuff.<br>";
				}
			}

			//Charge changes for defender
			if(!defensiveSpecialActivated){
				var gainCharge = 0;
				var loseCharge = 0;
				var skillNames = [];

				if(this.initiator && enemy.has("Summer's Breath")){
					gainCharge = Math.max(gainCharge, 1);
					skillNames.push(data.skills[enemy.weaponIndex].name);
				}
				if(enemy.hasAtRefineIndex("Magic Absorption", enemy.refineIndex)){
					if(this.weaponType == "redtome" || this.weaponType == "bluetome" || this.weaponType == "greentome"){
						gainCharge = Math.max(gainCharge, 1);
						skillNames.push(data.skills[enemy.weaponIndex].name + " (Refined)");
					}
				}
				if (enemy.hasExactly("Missiletainn (Sword)")){
					gainCharge = Math.max(gainCharge, 1);
					skillNames.push(data.skills[enemy.weaponIndex].name);
				}
				if (enemy.hasExactly("Storm Sieglinde") && (enemy.adjacent2_foe - 1 >= enemy.adjacent2)){
					gainCharge = Math.max(gainCharge, 1);
					skillNames.push(data.skills[enemy.weaponIndex].name);
				}
				if(this.initiator && enemy.has("Fierce Breath")){
					gainCharge = Math.max(gainCharge, 1);
					skillNames.push(data.skills[enemy.aIndex].name);
				}
				if(this.initiator && enemy.has("Steady Breath")){
					gainCharge = Math.max(gainCharge, 1);
					skillNames.push(data.skills[enemy.aIndex].name);
				}
				if(this.initiator && enemy.has("Warding Breath")){
					gainCharge = Math.max(gainCharge, 1);
					skillNames.push(data.skills[enemy.aIndex].name);
				}
				if (enemy.has("Special Fighter")){
					if (enemy.combatStartHp/enemy.maxHp >= 1.1 - enemy.has("Special Fighter") * 0.2){
						gainCharge = Math.max(gainCharge, 1);
						skillNames.push(data.skills[enemy.bIndex].name);
					}
				}

				if (gainCharge > 0){
					enemy.charge += gainCharge;
					damageText += enemy.name + " gains " + gainCharge + " charge with " + skillNames.join(", ") + ".<br>";
				}

				//Reset skillNames
				skillNames = []

				if(this.hasAtIndex("Guard", this.bIndex)){
					if(this.combatStartHp / this.maxHp >= 1.1 - this.hasAtIndex("Guard", this.bIndex) * 0.1){
						loseCharge = Math.max(loseCharge, 1);
						skillNames.push(data.skills[this.bIndex].name);
					}
				}
				if(this.has("Devilish Bow") || this.has("Bottled Juice") || this.has("Hack-o'-Lantern+")){
					loseCharge = Math.max(loseCharge, 1);
					skillNames.push(data.skills[this.weaponIndex].name);
				}
				if (this.has("Special Fighter")){
					if (this.combatStartHp/this.maxHp >= 1.1 - this.has("Special Fighter") * 0.2){
						loseCharge = Math.max(loseCharge, 1);
						skillNames.push(data.skills[this.bIndex].name);
					}
				}
				if (!this.initiator && this.hasExactly("Steady Stance 4")){
					loseCharge = Math.max(loseCharge, 1);
					skillNames.push(data.skills[this.aIndex].name);
				}

				if (loseCharge > 0){
					enemy.charge -= loseCharge;
					damageText += enemy.name + " loses " + loseCharge + " charge due to " + skillNames.join(", ") + ".<br>";
				}

				//Defender gains a charge when attacked
				if (!enemy.bewitched){
					enemy.charge++;
				} else{
					damageText += enemy.name + " gains no charge from defending due to Witchy Wand debuff.<br>";
				}
			}

			//Show hp
			//Make sure challenger is first and in blue
			if(this.challenger){
				damageText += this.name + " <span class=\"blue\">" + this.hp + "</span> : " + enemy.name + " <span class=\"red\">" + enemy.hp + "</span><br>";
			}
			else{
				damageText += enemy.name + " <span class=\"blue\">" + enemy.hp + "</span> : " + this.name + " <span class=\"red\">" + this.hp + "</span><br>";
			}

			//Do damage again if using a brave weapon
			if(brave && enemy.hp > 0){
				damageText += this.name + " attacks again with " + data.skills[this.weaponIndex].name + (this.refineIndex != -1 ? " (Refined)" : "") + ".<br>";
				damageText += this.doDamage(enemy, false, false, false);
			}
		}

		//Special trigger check
		if (AOEActivated || offensiveSpecialActivated){
			this.triggered = true;
		}
		if (defensiveSpecialActivated){
			enemy.triggered = true;
		}

		return damageText;
	}

	//Represents a full round of combat
	//TODO: Refactor 'this/enemy' duplicate codes into 'this.function(enemy)/enemy.function(this)' functions
	this.attack = function(enemy, round, buffRound, debuffRound, galeforce){

		//Initialize round
		var roundText = "";			//Common theme: text is returned by helper functions, so the functions are called by adding them to roundText
		this.initiator = true;
		enemy.initiator = false;
		enemy.didAttack = false;
		lastAttacker = "none";
		this.chargedDamage = 0;
		enemy.chargedDamage = 0;
		this.triggered = false;
		enemy.triggered = false;

		//Get relevant defense for simplified text output
		//***This variable isn't used???***
		var relevantDefType = (enemy.attackType == "magical") ? "res" : "def";

		//Initialize combat buffs - remove previous round buffs
		this.combatBuffs = {"atk":0,"spd":0,"def":0,"res":0};

		//Don't do any buff crap if it's the second move of a turn (galeforce)
		//***These are turn start skill effects***
		if(!galeforce){
			//Check self buffs (defiant skills)
			roundText += this.turnStartBuff(enemy);

			//Check for enemy debuffs
			roundText += this.turnStartDebuff(enemy);
			roundText += enemy.turnStartDebuff(this);

			//Apply turnStart effects
			roundText += this.buffStart(buffRound);
			roundText += this.debuffStart(debuffRound, enemy);

			//Set initial status
			if (round == 1){
				if(options.panic_challenger){
					this.challenger ? this.panicked = true : enemy.panicked = true;
				}
				if(options.panic_enemy){
					enemy.challenger ? this.panicked = true : enemy.panicked = true;
				}
				if(options.rush_challenger){
					this.challenger ? this.rushed = true : enemy.rushed = true;
				}
				if(options.rush_enemy){
					enemy.challenger ? this.rushed = true : enemy.rushed = true;
				}
				if(options.flash_challenger){
					this.challenger ? this.flashed = true : enemy.flashed = true;
				}
				if(options.flash_enemy){
					enemy.challenger ? this.flashed = true : enemy.flashed = true;
				}
				if(options.harsh_command_challenger){
					this.challenger ? this.harshed = true : enemy.harshed = true;
				}
				if(options.harsh_command_enemy){
					enemy.challenger ? this.harshed = true : enemy.harshed = true;
				}
				if(options.close_def_challenger){
					this.challenger ? this.close_defed = true : enemy.close_defed = true;
				}
				if(options.close_def_enemy){
					enemy.challenger ? this.close_defed = true : enemy.close_defed = true;
				}
				if(options.distant_def_challenger){
					this.challenger ? this.distant_defed = true : enemy.distant_defed = true;
				}
				if(options.distant_def_enemy){
					enemy.challenger ? this.distant_defed = true : enemy.distant_defed = true;
				}
				if(options.movement_challenger){
					this.challenger ? this.moveBuffed = true : enemy.moveBuffed = true;
				}
				if(options.movement_enemy){
					enemy.challenger ? this.moveBuffed = true : enemy.moveBuffed = true;
				}
				if(options.candlelight_challenger){
					this.challenger ? this.lit = true : enemy.lit = true;
				}
				if(options.candlelight_enemy){
					enemy.challenger ? this.lit = true : enemy.lit = true;
				}
				if(options.triangled_challenger){
					this.challenger ? this.triangled = true : enemy.triangled = true;
				}
				if(options.triangled_enemy){
					enemy.challenger ? this.triangled = true : enemy.triangled = true;
				}
				if(options.bewitched_challenger){
					this.challenger ? this.bewitched = true : enemy.bewitched = true;
				}
				if(options.bewitched_enemy){
					enemy.challenger ? this.bewitched = true : enemy.bewitched = true;
				}
				if(this.challenger ? options.threaten_enemy : options.threaten_challenger){
					roundText += enemy.threaten(this);
				}
				if(this.challenger ? options.threaten_challenger : options.threaten_enemy){
					roundText += this.threaten(enemy);
				}
			}else{
				//Always apply threaten effects from enemy on following rounds
				roundText += this.threaten(enemy);
			}


			/*
			//Check threaten if not first turn (unless startThreatened is on)
			if((options.threatenRule=="Both"||options.threatenRule=="Attacker") && (round == 1)){
				roundText += enemy.threaten(this);
			}
			if((options.threatenRule=="Both"||options.threatenRule=="Defender") || (round != 1)){
				roundText += this.threaten(enemy);
			}
			*/

			//Check for charge effects
			//***Does Wrath check for health after Renew?***
			roundText += this.charging();
		}

		//Check for unarmed weapon
		//TODO: Check for issues.
		//***Having the function return this early skips the rest of the combat scripts, need to check for issues with post-combat effects***
		if (this.weaponIndex == -1){
			roundText += this.name + " is unarmed and cannot attack.";
			return roundText;
		}

		//Set after renewal
		this.combatStartHp = this.hp;
		enemy.combatStartHp = enemy.hp;

		//Current Logic: Initial stats + field buffs -> aoe specials -> add spurs (bladetome bonus goes in here)
		//Previous logic: calculate spurs -> stats + field buff/debuff + spurs -> aoe specials - spurs -> add bladetome bonus

		//Initialize combat stats + field buffs
		//***Replaces effAtk, effSpd, etc. so stats only have to be calculated once per round and used in both attack() and doDamage()***
		this.combatStat = {"atk":0,"spd":0,"def":0,"res":0};
		enemy.combatStat = {"atk":0,"spd":0,"def":0,"res":0};
		roundText += this.setCombatStats(enemy);
		roundText += enemy.setCombatStats(this);

		//Check for AOE special activation before combat
		roundText += this.doDamage(enemy, false, true, false);

		//Initialize combat spurs
		this.combatSpur = {"atk":0,"spd":0,"def":0,"res":0};
		enemy.combatSpur = {"atk":0,"spd":0,"def":0,"res":0};
		roundText += this.setCombatSpur(enemy);
		roundText += enemy.setCombatSpur(this);

		//Add manual spur and combat spur into combat stats
		roundText += this.setCombatBonus(enemy);
		roundText += enemy.setCombatBonus(this);

		/* Moved into setCombatBonus()
		//In-combat bonuses:
		//Bladetome bonus
		if (this.has("Raudrblade") || this.has("Blarblade") || this.has("Gronnblade") || this.hasExactly("Thunderhead")){
			var atkbonus = this.combatBuffs.atk + this.combatBuffs.spd + this.combatBuffs.def + this.combatBuffs.res;
			this.combatStat.atk += atkbonus;
			if (atkbonus != 0){roundText += this.name + " gains +" + atkbonus + " Atk from " + data.skills[this.weaponIndex].name + ".<br>";}
		}
		if (enemy.has("Raudrblade") || enemy.has("Blarblade") || enemy.has("Gronnblade") || enemy.hasExactly("Thunderhead")){
			var atkbonus = enemy.combatBuffs.atk + enemy.combatBuffs.spd + enemy.combatBuffs.def + enemy.combatBuffs.res;
			enemy.combatStat.atk += atkbonus;
			if (atkbonus != 0){roundText += enemy.name + " gains +" + atkbonus + " Atk from " + data.skills[enemy.weaponIndex].name + ".<br>";}
		}
		//Blizzard bonus
		if(this.has("Blizzard")){
			var atkbonus = -1 * (enemy.combatDebuffs.atk + enemy.combatDebuffs.spd + enemy.combatDebuffs.def + enemy.combatDebuffs.res);
			this.combatStat.atk += atkbonus;
			if (atkbonus != 0){roundText += this.name + " gains +" + atkbonus + " Atk from " + data.skills[this.weaponIndex].name + ".<br>";}
		}
		if(enemy.has("Blizzard")){
			var atkbonus = -1 * (this.combatDebuffs.atk + this.combatDebuffs.spd + this.combatDebuffs.def + this.combatDebuffs.res);
			enemy.combatStat.atk += atkbonus;
			if (atkbonus != 0){roundText += enemy.name + " gains +" + atkbonus + " Atk from " + data.skills[enemy.weaponIndex].name + ".<br>";}
		}
		*/

		//Check for Brave weapons, brave will be passed to this.doDamage
		var doubleInitiate = false;
		var doubleCounter = false;
		if (this.has("Brave Sword") 			|| this.has("Brave Lance") 	|| this.has("Brave Axe") 				|| this.has("Brave Bow")
			|| this.hasExactly("Dire Thunder") 	|| this.hasExactly("Amiti") || this.hasExactly("Meisterschwert") 	|| this.hasExactly("Cherche's Axe")
		){
			doubleInitiate = true;
		}
		if (this.hasExactly("Double Lion") && this.hp/this.maxHp == 1){
			doubleInitiate = true;
		}
		if (this.hasAtRefineIndex("Brave Falchion", this.refineIndex) && (this.combatStartHp / this.maxHp == 1)){
			doubleInitiate = true;
		}
		if (this.hasAtRefineIndex("Triangle", this.refineIndex) && (this.adjacent + this.adjacent2 >= 2)){
			doubleInitiate = true;
		}
		if (enemy.hasExactly("Meisterschwert")){
			doubleCounter = true;
		}

		//Check for Vantage
		//***Does Vantage + Valaskjalf override Hardy Bearing?***
		var vantage = false;
		if(enemy.has("Vantage")){
			if(enemy.hp/enemy.maxHp <= .25 * enemy.has("Vantage")){
				vantage = true;
			}
		}
		if(enemy.has("Valaskjalf")){
			if(enemy.hp/enemy.maxHp <= .50){
				vantage = true;
			}
		}

		//Check for Desperation
		//***Does Desperation + Sol Katti override Hardy Bearing?***
		var desperation = false;
		if (this.has("Desperation")){
			if(this.hp/this.maxHp <= .25 * this.has("Desperation")){
				desperation = true;
			}
		}
		if (this.has("Sol Katti")){
			if (this.refineIndex != -1 && this.hp/this.maxHp <= .75){
				desperation = true;
			} else if (this.hp/this.maxHp <= .5){
				desperation = true;
			}
		}
		if (this.has("Juicy Wave") || this.has("Starfish") || this.has("Fishie Bow")){
			if(this.hp/this.maxHp <= .75 ){
				desperation = true;
			}
		}
		if (this.has("Forseti") && this.hp/this.maxHp >= .5){
			desperation = true;
		}

		//Check for skills that disable change in attack priority
		if (this.has("Hardy Bearing") 		|| (enemy.has("Hardy Bearing") && (enemy.combatStartHp / enemy.maxHp >= (1.5 - enemy.has("Hardy Bearing") * 0.5)))
			|| this.has("Cloud Maiougi") 	|| enemy.has("Cloud Maiougi")
			|| this.hasExactly("Dawn Suzu")	|| enemy.hasExactly("Dawn Suzu")
			|| this.has("Sky Maiougi") 		|| enemy.has("Sky Maiougi")
			|| this.has("Dusk Uchiwa") 		|| enemy.has("Dusk Uchiwa")
			){
			if (vantage){
				roundText += enemy.name + "'s skills with vantage effects are disabled.<br>";
			}
			vantage = false;
			if (desperation){
				roundText += this.name + "'s skills with desperation effects are disabled.<br>";
			}
			desperation = false;
		}

		//Combat attack rank for follow-up attacks
		//***<0 - no follow-up, 0 - speed check, >0 - guaranteed follow-up***
		var thisAttackRank = 0;
		var thisAttackRankChanged = false;
		var enemyAttackRank = 0;
		var enemyAttackRankChanged = false;

		//Check for Sweep skills
		var firesweep = false;
		var windsweep = 0;
		var watersweep = 0;

		//Sweep Effects are toggable through menu options
		if (this.challenger ? options.sweep_challenger : options.sweep_enemy){
			if(this.has("Firesweep")){
				firesweep = true;
			}
			if(this.has("Windsweep")){
				windsweep = (this.has("Windsweep") * -2) + 7;
				if(this.has("Phantom Spd")){
					windsweep += -2 + (this.has("Phantom Spd") * -3);
				}
			}
			if(this.has("Watersweep")){
				watersweep = (this.has("Watersweep") * -2) + 7;
				if(this.has("Phantom Spd")){
					watersweep += -2 + (this.has("Phantom Spd") * -3);
				}
			}
			if(windsweep){
				thisAttackRank--;
				thisAttackRankChanged = true;
			}
			if(watersweep){
				thisAttackRank--;
				thisAttackRankChanged = true;
			}
		}
		if (enemy.challenger ? options.sweep_challenger : options.sweep_enemy){
			if(enemy.has("Firesweep")){
				firesweep = true;
			}
		}

		//Check for any-distance counterattack
		var anyRangeCounter = canCounterAnyRange(enemy);

		if(enemy.hasExactly("Unique Range Special Wait") && (enemy.specialIndex != -1 && data.skills[enemy.specialIndex].charge <= enemy.charge)){
			anyRangeCounter = true
		}
		if(enemy.hasExactly("Unique Range Dragons") && this.weaponType == "dragon"){
			anyRangeCounter = true		
		}

		//Check if enemy can counter
		var enemyCanCounter = true;

		if (this.range != enemy.range && !anyRangeCounter){
			enemyCanCounter = false;
		}
		if (enemy.weaponIndex == -1){
			enemyCanCounter = false;
			roundText += enemy.name + " is unarmed and cannot counterattack.<br>";
		}
		if (firesweep){
			enemyCanCounter = false;
			roundText += enemy.name + " cannot counterattack because of Firesweep effect.<br>";
		}
		if (windsweep && data.physicalWeapons.indexOf(enemy.weaponType) != -1 && this.combatStat.spd - enemy.combatStat.spd >= windsweep){
			enemyCanCounter = false;
			roundText += enemy.name + " cannot counterattack because of Windsweep effect.<br>";
		}
		if (watersweep && data.magicalWeapons.indexOf(enemy.weaponType) != -1 && this.combatStat.spd - enemy.combatStat.spd >= watersweep){
			enemyCanCounter = false;
			roundText += enemy.name + " cannot counterattack because of Watersweep effect.<br>";
		}
		if (this.has("Dazzling Staff") && enemyCanCounter){
			if(this.combatStartHp / this.maxHp >= 1.5 + this.has("Dazzling Staff") * -0.5){
				roundText += enemy.name + " cannot counterattack because of Dazzling Staff.<br>";
				enemyCanCounter = false;
			}
		}
		if (this.hasExactly("Dazzling") && enemyCanCounter){
			roundText += enemy.name + " cannot counterattack because of Dazzling effect.<br>";
			enemyCanCounter = false;
		}
		if (enemy.lit && enemyCanCounter){
			roundText += enemy.name + " cannot counterattack because of Candlelight debuff.<br>";
			enemyCanCounter = false;
		}
		if (this.has("Sacae's Blessing") && (enemy.weaponType == "axe" || enemy.weaponType == "sword" ||enemy.weaponType == "lance")){
			roundText += enemy.name + " cannot counterattack because of Sacae's Blessing.<br>";
			enemyCanCounter = false;
		}
		if (this.has("Magic Suppression") && (enemy.weaponType == "redtome" || enemy.weaponType == "bluetome" ||enemy.weaponType == "greentome")){
			roundText += enemy.name + " cannot counterattack because of " + data.skills[this.weaponIndex].name + " (Refined).<br>";
			enemyCanCounter = false;
		}
		if (this.hasExactly("Hlidskjalf")){
			roundText += enemy.name + " cannot counterattack because of Hlidskjalf.<br>";
			enemyCanCounter = false;
		}
		if (this.hasExactly("Binding Shield") && enemy.weaponType == "dragon" && enemyCanCounter) {
			roundText += enemy.name + " cannot counterattack because of Binding Shield.<br>";
			enemyCanCounter = false;
		}
		if (this.hasExactly("Gjoll") && enemy.panicked){
			roundText += enemy.name + " cannot counterattack because of Gjoll.<br>";
			enemyCanCounter = false;
		}

		//Null Follow-Up
		//TODO: Reduce redundancy
		var thisRankSkillNull = false;
		var enemyRankSkillNull = false;
		if (this.has("Null Follow Up")){
			if (this.has("Null Follow Up") < 3){
				if (this.hp >= this.maxHp/this.has("Null Follow Up")){
					enemyRankSkillNull = true;
					roundText += enemy.name + " is prevented from using skills that affect follow-up attacks.<br>";
				}
			}else{
				enemyRankSkillNull = true;
				roundText += enemy.name + " is prevented from using skills that affect follow-up attacks.<br>";
			}
		}
		if (enemy.has("Null Follow Up")){
			if (enemy.has("Null Follow Up") < 3){
				if (enemy.hp >= enemy.maxHp/enemy.has("Null Follow Up")){
					thisRankSkillNull = true;
					roundText += this.name + " is prevented from using skills that affect follow-up attacks.<br>";
				}
			}else{
				thisRankSkillNull = true;
				roundText += this.name + " is prevented from using skills that affect follow-up attacks.<br>";
			}
		}
		var thisBreakLevel = 2; // hp threshold
		var enemyBreakLevel = 2; // hp threshold

		//Hero Rank Skills
		if (!thisRankSkillNull){
			//Check for auto follow-up skills
			if (enemyCanCounter){
				if (this.hasAtIndex("Brash Assault", this.bIndex)){
					if (this.hp/this.maxHp <= .2 +  this.hasAtIndex("Brash Assault", this.bIndex) * 0.1){
						thisAttackRank++;
						thisAttackRankChanged = true;
					}
				}
				if (this.hasAtIndex("Brash Assault", this.sIndex)){
					if (this.hp/this.maxHp <= .2 +  this.hasAtIndex("Brash Assault", this.sIndex) * 0.1){
						thisAttackRank++;
						thisAttackRankChanged = true;
					}
				}
				if (this.has("Sol Katti") && this.hasAtRefineIndex("Brash Assault", this.refineIndex)){
					if (this.hp / this.maxHp <= 0.75){
						thisAttackRank++;
						thisAttackRankChanged = true;
					}
				}
				if (this.hasExactly("Hoarfrost Knife") && enemy.range == "melee"){
					thisAttackRank++;
					thisAttackRankChanged = true;
				}
			}
			if (this.hasAtIndex("Bold Fighter", this.bIndex)){
				if (this.hasAtIndex("Bold Fighter", this.bIndex) == 3 || (this.combatStartHp / this.maxHp >= 1.0 / this.hasAtIndex("Bold Fighter", this.bIndex))){
					thisAttackRank++;
					thisAttackRankChanged = true;
				}
			}
			if (this.hasAtRefineIndex("Pursuit", this.refineIndex)){
				if (this.combatStartHp / this.maxHp >= 0.9){
					thisAttackRank++;
					thisAttackRankChanged = true;
				}
			}
			if (this.has("Follow-Up Ring")){
				if (this.combatStartHp / this.maxHp >= 0.5){
					thisAttackRank++;
					thisAttackRankChanged = true;
				}
			}
			if (this.hasExactly("Flame Siegmund")){
				if (this.adjacent2_foe >= this.adjacent2){
					thisAttackRank++;
					thisAttackRankChanged = true;
				}
			}
			if (this.hasExactly("Spirit Breath") && this.combatStat.def >= enemy.combatStat.def + 5){
				thisAttackRank++;
				thisAttackRankChanged = true;
			}
			if (this.hasExactly("Garm")){
				if (this.combatBuffs.atk != 0 || this.combatBuffs.spd != 0 || this.combatBuffs.def != 0 || this.combatBuffs.res != 0
					|| (this.hasExactly("Armored Boots") && this.combatStartHp/this.maxHp == 1)
					|| this.moveBuffed
					){
					thisAttackRank++;
					thisAttackRankChanged = true;
				}
			}
			if (this.hasExactly("Binding Shield") && enemy.weaponType == "dragon"){
				thisAttackRank++;
				thisAttackRankChanged = true;
			}
			if (this.hasExactly("Gjoll") && enemy.panicked){
				thisAttackRank++;
				thisAttackRankChanged = true;
			}
			//Check for Wary Fighter
			if (this.has("Wary Fighter")){
				if (this.hp/this.maxHp >= 1.1 - 0.2 * this.has("Wary Fighter")){
					thisAttackRank--;
					enemyAttackRank--;
					thisAttackRankChanged = true;
					enemyAttackRankChanged = true;
				}
			}
			if (this.hasExactly("Great Flame") && this.combatStat.def >= enemy.combatStat.def + 5){
				enemyAttackRank--;
				enemyAttackRankChanged = true;
			}
			if (this.hasExactly("Thunder Armads") && this.adjacent2 > this.adjacent2_foe){
				enemyAttackRank--;
				enemyAttackRankChanged = true;
			}
			if (this.hasAtRefineIndex("Wary Ranged", this.refineIndex) && enemy.range == "ranged" && this.combatStat.def >= enemy.combatStat.def + 1){
				enemyAttackRank--;
				enemyAttackRankChanged = true;
			}

			//Check for Breaker skills
			if(this.weaponType=="sword" && enemy.has("Swordbreaker")){
				thisBreakLevel = 1.1 - enemy.has("Swordbreaker") * 0.2;
			}
			else if(this.weaponType=="lance" && enemy.has("Lancebreaker")){
				thisBreakLevel = 1.1 - enemy.has("Lancebreaker") * 0.2;
			}
			else if(this.weaponType=="axe" && enemy.has("Axebreaker")){
				thisBreakLevel = 1.1 - enemy.has("Axebreaker") * 0.2;
			}
			else if(this.weaponType=="redtome" && enemy.has("R Tomebreaker")){
				thisBreakLevel = 1.1 - enemy.has("R Tomebreaker") * 0.2;
			}
			else if(this.weaponType=="bluetome" && enemy.has("B Tomebreaker")){
				thisBreakLevel = 1.1 - enemy.has("B Tomebreaker") * 0.2;
			}
			else if(this.weaponType=="greentome" && enemy.has("G Tomebreaker")){
				thisBreakLevel = 1.1 - enemy.has("G Tomebreaker") * 0.2;
			}
			else if(this.weaponType=="bow" && this.color=="gray" && enemy.has("Bowbreaker")){
				thisBreakLevel = 1.1 - enemy.has("Bowbreaker") * 0.2;
			}
			else if(this.weaponType=="dagger" && this.color=="gray" && enemy.has("Daggerbreaker")){
				thisBreakLevel = 1.1 - enemy.has("Daggerbreaker") * 0.2;
			}

			//Other Stacking Breaker skills
			if(this.weaponType=="dagger" && enemy.has("Assassin's Bow")){
				thisAttackRank--;
				enemyAttackRank++;
				thisAttackRankChanged = true;
				enemyAttackRankChanged = true;
			}
		}

		//Enemy Rank Skills
		if (!enemyRankSkillNull){
			//Check for auto follow-up counters
			if(enemy.hasAtIndex("Quick Riposte", enemy.bIndex)){
				if(enemy.combatStartHp/enemy.maxHp >= 1 - 0.1 * enemy.hasAtIndex("Quick Riposte", enemy.bIndex)){
					enemyAttackRank++;
					enemyAttackRankChanged = true;
				}
			}
			if(enemy.hasAtIndex("Quick Riposte", enemy.sIndex)){
				if(enemy.combatStartHp/enemy.maxHp >= 1 - 0.1 * enemy.hasAtIndex("Quick Riposte", enemy.sIndex)){
					enemyAttackRank++;
					enemyAttackRankChanged = true;
				}
			}
			if (enemy.hasAtRefineIndex("Quick Riposte", enemy.refineIndex)){
				if (enemy.combatStartHp/enemy.maxHp >= .5){
					enemyAttackRank++;
					enemyAttackRankChanged = true;
				}
			}
			if (enemy.hasAtIndex("Vengeful Fighter", enemy.bIndex)){
				if (enemy.combatStartHp / enemy.maxHp >= (1.0 - (enemy.hasAtIndex("Vengeful Fighter", enemy.bIndex) * 0.1) - ((enemy.hasAtIndex("Vengeful Fighter", enemy.bIndex) - 1) * 0.1))){
					enemyAttackRank++;
					enemyAttackRankChanged = true;
				}
			}
			if (enemy.hasExactly("Maltet")){
				if (enemy.combatStartHp/enemy.maxHp >= 0.5){
					enemyAttackRank++;
					enemyAttackRankChanged = true;
				}
			}
			if (enemy.hasExactly("Armads")){
				if (enemy.combatStartHp/enemy.maxHp >= 0.8){
					enemyAttackRank++;
					enemyAttackRankChanged = true;
				}
			}
			if (enemy.has("Follow-Up Ring")){
				if (enemy.combatStartHp/enemy.maxHp >= 0.5){
					enemyAttackRank++;
					enemyAttackRankChanged = true;
				}
			}
			if (enemy.hasExactly("Flame Siegmund")){
				if (enemy.adjacent2_foe >= enemy.adjacent2){
					enemyAttackRank++;
					enemyAttackRankChanged = true;
				}
			}
			if (enemy.hasExactly("Garm")){
				if (enemy.combatBuffs.atk != 0 || enemy.combatBuffs.spd != 0 || enemy.combatBuffs.def != 0 || enemy.combatBuffs.res != 0
					|| (enemy.hasExactly("Armored Boots") && enemy.combatStartHp/enemy.maxHp == 1)
					|| enemy.moveBuffed
					){
					enemyAttackRank++;
					enemyAttackRankChanged = true;
				}
			}
			if (enemy.hasExactly("Binding Shield") && this.weaponType == "dragon"){
				enemyAttackRank++;
				enemyAttackRankChanged = true;
			}
			if (enemy.hasExactly("Gjoll") && this.panicked){
				enemyAttackRank++;
				enemyAttackRankChanged = true;
			}

			//Check for Wary Fighter
			if (enemy.has("Wary Fighter")){
				if (enemy.hp/enemy.maxHp >= 1.1 - 0.2 * enemy.has("Wary Fighter")){
					thisAttackRank--;
					enemyAttackRank--;
					thisAttackRankChanged = true;
					enemyAttackRankChanged = true;
				}
			}
			if (enemy.hasExactly("Great Flame") && enemy.combatStat.def >= this.combatStat.def + 5){
				thisAttackRank--;
				thisAttackRankChanged = true;
			}
			if (enemy.hasExactly("Thunder Armads") && enemy.adjacent2 > enemy.adjacent2_foe){
				thisAttackRank--;
				thisAttackRankChanged = true;
			}
			if (enemy.hasAtRefineIndex("Wary Ranged", enemy.refineIndex) && this.range == "ranged" && enemy.combatStat.def >= this.combatStat.def + 1){
				thisAttackRank--;
				thisAttackRankChanged = true;
			}
			if (enemy.hasExactly("Binding Shield") && this.weaponType == "dragon"){
				thisAttackRank--;
				thisAttackRankChanged = true;
			}
			if (enemy.hasExactly("Gjoll") && this.panicked){
				thisAttackRank--;
				thisAttackRankChanged = true;
			}

			//Check for Breaker skills
			if(enemy.weaponType=="sword" && this.has("Swordbreaker")){
				enemyBreakLevel = 1.1 - this.has("Swordbreaker") * 0.2;
			}
			else if(enemy.weaponType=="lance" && this.has("Lancebreaker")){
				enemyBreakLevel = 1.1 - this.has("Lancebreaker") * 0.2;
			}
			else if(enemy.weaponType=="axe" && this.has("Axebreaker")){
				enemyBreakLevel = 1.1 - this.has("Axebreaker") * 0.2;
			}
			else if(enemy.weaponType=="redtome" && this.has("R Tomebreaker")){
				enemyBreakLevel = 1.1 - this.has("R Tomebreaker") * 0.2;
			}
			else if(enemy.weaponType=="bluetome" && this.has("B Tomebreaker")){
				enemyBreakLevel = 1.1 - this.has("B Tomebreaker") * 0.2;
			}
			else if(enemy.weaponType=="greentome" && this.has("G Tomebreaker")){
				enemyBreakLevel = 1.1 - this.has("G Tomebreaker") * 0.2;
			}
			else if(enemy.weaponType=="bow" && enemy.color=="gray" && this.has("Bowbreaker")){
				enemyBreakLevel = 1.1 - this.has("Bowbreaker") * 0.2;
			}
			else if(enemy.weaponType=="dagger" && enemy.color=="gray" && this.has("Daggerbreaker")){
				enemyBreakLevel = 1.1 - this.has("Daggerbreaker") * 0.2;
			}

			//Other Stacking Breaker skills
			if(enemy.weaponType=="dagger" && this.has("Assassin's Bow")){
				thisAttackRank++;
				enemyAttackRank--;
				thisAttackRankChanged = true;
				enemyAttackRankChanged = true;
			}
		}

		//Breaker Skill conclusion
		if(enemy.hp / enemy.maxHp >= thisBreakLevel){
			thisAttackRank--;
			enemyAttackRank++;
			thisAttackRankChanged = true;
			enemyAttackRankChanged = true;
		}
		if(this.hp / this.maxHp >= enemyBreakLevel){
			thisAttackRank++;
			enemyAttackRank--;
			thisAttackRankChanged = true;
			enemyAttackRankChanged = true;
		}

		//Check if follow-up attacks occur
		var thisFollowUp = false;
		var enemyFollowUp = false;

		if (thisAttackRank > 0){
			thisFollowUp = true;
			roundText += this.name + " can make an automatic follow-up attack.<br>";
		}else if (thisAttackRank < 0){
			thisFollowUp = false;
			roundText += this.name + " is prevented from making a follow-up attack.<br>";
		}else{
			thisFollowUp = this.combatStat.spd-enemy.combatStat.spd >= 5;
			if (thisAttackRankChanged){
				roundText += this.name + " is affected by conflicting follow-up skills, which all cancels out.<br>";
			}
		}
		if (enemyAttackRank > 0){
			enemyFollowUp = true;
			roundText += enemy.name + " can make an automatic follow-up attack.<br>";
		}else if (enemyAttackRank < 0){
			enemyFollowUp = false;
			roundText += enemy.name + " is prevented from making a follow-up attack.<br>";
		}else{
			enemyFollowUp = this.combatStat.spd-enemy.combatStat.spd <= -5;
			if (enemyAttackRankChanged){
				roundText += enemy.name + " is affected by conflicting follow-up skills, which all cancels out.<br>";
			}
		}

		//Combat Damage
		//***doDamage parameters - (enemy, brave, AOE, firstAttack)***

		//Vantage: Enemy first attack
		if(vantage && enemyCanCounter){
			roundText += enemy.name + " counterattacks first with vantage.<br>";
			roundText += enemy.doDamage(this, doubleCounter, false, true);
		}

		//Initiator first attack
		if(this.hp > 0){
			roundText += this.doDamage(enemy, doubleInitiate, false, true);
		}

		//Desperation: Initiator second attack
		if(this.hp > 0 && enemy.hp > 0 && desperation && thisFollowUp){
			roundText += this.name + " attacks again immediately with desperation.<br>";
			roundText += this.doDamage(enemy, doubleInitiate, false, false);
		}

		//Non-Vantage: Enemy first attack
		//Vantage: Enemy second attack
		if(enemy.hp > 0 && this.hp > 0 && (!vantage || (vantage && enemyFollowUp && enemyCanCounter))){
			if(enemyCanCounter){
				roundText += enemy.doDamage(this, doubleCounter, false, !vantage);
			}
		}

		//Non-Desperation: Initiator second attack
		if(this.hp > 0 && enemy.hp > 0 && !desperation && thisFollowUp){
			roundText += this.doDamage(enemy, doubleInitiate, false, false);
		}

		//Non-Vantage: Enemy second attack
		if(this.hp > 0 && enemy.hp > 0 && !vantage && enemyCanCounter && enemyFollowUp){
			roundText += enemy.doDamage(this, doubleCounter, false, false);
		}

		//Do post-combat damage to enemy if enemy isn't dead
		if(enemy.hp > 0){
			roundText += this.poisonEnemy(enemy);
			roundText += this.painEnemy(enemy);
			roundText += enemy.endCombatDamage();
		}

		//Do post-combat damage to this if this isn't dead
		//No poison because this initiated
		if(this.hp > 0){
			roundText += enemy.painEnemy(this);
			roundText += this.endCombatDamage();
		}

		//Initialize combat debuffs - remove debuffs when action done and round complete
		this.combatDebuffs = {"atk":0,"spd":0,"def":0,"res":0};
		this.panicked = false;
		this.lit = false;
		this.triangled = false;
		this.bewitched = false;

		//Post-Combat Buffs
		//Rogue dagger works on enemy turn, but buffs are reset at beginning of player turn,
		//so it only matters if a rogue gets attacked twice in one turn, which is possible with Galeforce
		if (this.hp > 0){
			roundText += this.postCombatBuff();
			roundText += this.postCombatHeal();
		}
		if (enemy.hp > 0){
			roundText += enemy.postCombatBuff();
			roundText += enemy.postCombatHeal();
		}
		//Post-combat Debuffs
		if(this.hp > 0 && enemy.hp > 0){
			//Apply post-combat debuffs (seal)
			roundText += this.seal(enemy);
			roundText += enemy.seal(this);

			//Status
			//TODO: Refactor skill check for this.attacked and enemy.attacked into one function so that skills don't have to be written twice
			if (this.didAttack){
				if (this.hasExactly("Panic")					|| this.hasExactly("Panic+") 	|| this.has("Legion's Axe")
					|| ((this.hasExactly("Monstrous Bow+") 	|| this.hasExactly("Spectral Tome+")) && this.refineIndex != -1)
				){
					enemy.panicked = true;
					roundText += this.name + " panics " + enemy.name + ".<br>";
				}
				if (this.has("Candlelight") || this.hasAtIndex("Flash", this.weaponIndex)){
					enemy.lit = true;
					roundText += this.name + " inflicts " + enemy.name + " with an inability to make counterattacks.<br>";
				}
				if (this.has("Trilemma")){
					enemy.triangled = true;
					roundText += this.name + " inflicts " + enemy.name + " with a boost to triangle affinity.<br>";
				}
				if (this.has("Witchy Wand")){
					enemy.resetCharge;
					roundText += this.name + " reduces " + enemy.name + "'s charges to zero after combat with " + data.skills[this.weaponIndex].name + ".<br>";
					enemy.bewitched = true;
					roundText += this.name + " inflicts " + enemy.name + " with decreased charge gain after attacks.<br>";
				}
			}
			if (enemy.didAttack){
				if (enemy.hasExactly("Panic") 				|| enemy.hasExactly("Panic+") 	|| enemy.has("Legion's Axe")
					|| ((enemy.hasExactly("Monstrous Bow+") || enemy.hasExactly("Spectral Tome+")) && enemy.refineIndex != -1)
				){
					this.panicked = true;
					roundText += enemy.name + " panics " + this.name + ".<br>";
				}
				if (enemy.has("Candlelight")){
					this.lit = true;
					roundText += enemy.name + " inflicts " + this.name + " with an inability to make counterattacks.<br>";
				}

				if (enemy.has("Trilemma")){
					this.triangled = true;
					roundText += enemy.name + " inflicts " + this.name + " with a boost to triangle affinity.<br>";
				}

				if (enemy.has("Witchy Wand")){
					this.resetCharge();
					roundText += enemy.name + " reduces " + this.name + "'s charges to zero after combat with " + data.skills[enemy.weaponIndex].name + ".<br>";
					this.bewitched = true;
					roundText += enemy.name + " inflicts " + this.name + " with decreased charge gain after attacks.<br>";
				}
			}

			//Finally, Galeforce!
			//***Check if this works with Dark Mystletainn***
			if(!galeforce && this.has("Galeforce") && data.skills[this.specialIndex].charge <= this.charge && (this.challenger ? options.galeforce_challenger : options.galeforce_enemy)){
				roundText += this.name + " initiates again with Galeforce!<br>";
				this.resetCharge();
				roundText += this.attack(enemy, round, 0, 0, true);
			}
		}

		return roundText;
	}
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

//Purely utility

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

function capitalize(string){
	if(string.length > 0){
		return string.charAt(0).toUpperCase() + string.slice(1);
	}
	else{
		return string;
	}
}

function replaceRecursive(original,replace){
	for(var key in replace){
		if(typeof original[key] == "object"){
			replaceRecursive(original[key],replace[key]);
		}
		else{
			original[key] = replace[key];
		}
	}
}

function changeDataVar(dataVar,newVal){
	var dataSplit = dataVar.split(".");
	var parsedVar = window;
	for(var level = 0; level < dataSplit.length; level++){
		if(dataSplit[level] == "list"){
			//Replace list with list[i]
			//This won't be the last run
			parsedVar = parsedVar[dataSplit[level]][options.customEnemySelected];
		}
		else{
			if(level == dataSplit.length-1){
				//Last run - set the variable
				parsedVar[dataSplit[level]] = newVal;
			}
			else{
				parsedVar = parsedVar[dataSplit[level]];
			}
		}
		if(typeof parsedVar == "undefined"){
			break;
		}
	}
}

function beginsWith(fullString, substring){
	return (fullString.slice(0, substring.length) == substring);
}

function endsWith(fullString, substring){
	return (fullString.slice(-substring.length) == substring);
}

function getHtmlPrefix(hero){
	var htmlPrefix = "";
	if(hero.challenger){
		htmlPrefix = "challenger_";
	}
	else{
		if(hero.isFl){
			htmlPrefix = "enemies_";
		}
		else{
			htmlPrefix = "cl_enemy_";
		}
	}
	return htmlPrefix;
}

function getSkillIndexFromId(skillid){
	var index = -1;
	for(var i = 0; i < data.skills.length; i++){
		if(data.skills[i].skill_id == skillid){
			index = i;
			break;
		}
	}
	//console.log("Looked for index of skill id " + skillid + "; found at " + index);
	return index;
}

function getIndexFromName(name,dataList,slot){
	//Skill/hero array is sorted by name + slot! (only name in case of heroes)
	name = name.toLowerCase();
	slot = slot || "";

	var leftBound = 0;
	var rightBound = dataList.length - 1;
	var checkingIndex;
	var testName;
	var testSlot;
	var testIsS;
	var found = -1;
	do{
		checkingIndex = Math.round((rightBound - leftBound) / 2 + leftBound);
		testName = dataList[checkingIndex].name.toLowerCase();
		testSlot = dataList[checkingIndex].slot || "";
		if(testName + testSlot == name + slot){
			found = checkingIndex;
			break;
		}
		else if(testName + testSlot > name + slot){
			rightBound = checkingIndex - 1;
		}
		else{
			leftBound = checkingIndex + 1;
		}
	}
	while(leftBound <= rightBound);

	return found;
}

function getAttackTypeFromWeapon(weaponType){
	if(data.physicalWeapons.indexOf(weaponType) != -1){
		return "physical";
	}
	else if(data.magicalWeapons.indexOf(weaponType) != -1){
		return "magical";
	}
	else{
		return "unknown";
	}
}

function verifyNumberInput(element,min,max){
	//contains number between two values and returns it
	newVal = parseInt($(element).val());
	if(!newVal){
		//If input is blank, make it 0
		newVal = 0;
		$(element).val(0);
	}
	if(newVal < min){
		$(element).val(min);
		newVal = min;
	}
	else if(newVal > max){
		$(element).val(max);
		newVal = max;
	}
	return newVal;
}

function removeDiacritics (str) {
	//Copied from
	//https://stackoverflow.com/questions/18123501/replacing-accented-characters-with-plain-ascii-ones
	//ð added to d
	var defaultDiacriticsRemovalMap = [
		{'base':'A', 'letters':/[\u0041\u24B6\uFF21\u00C0\u00C1\u00C2\u1EA6\u1EA4\u1EAA\u1EA8\u00C3\u0100\u0102\u1EB0\u1EAE\u1EB4\u1EB2\u0226\u01E0\u00C4\u01DE\u1EA2\u00C5\u01FA\u01CD\u0200\u0202\u1EA0\u1EAC\u1EB6\u1E00\u0104\u023A\u2C6F]/g},
		{'base':'AA','letters':/[\uA732]/g},
		{'base':'AE','letters':/[\u00C6\u01FC\u01E2]/g},
		{'base':'AO','letters':/[\uA734]/g},
		{'base':'AU','letters':/[\uA736]/g},
		{'base':'AV','letters':/[\uA738\uA73A]/g},
		{'base':'AY','letters':/[\uA73C]/g},
		{'base':'B', 'letters':/[\u0042\u24B7\uFF22\u1E02\u1E04\u1E06\u0243\u0182\u0181]/g},
		{'base':'C', 'letters':/[\u0043\u24B8\uFF23\u0106\u0108\u010A\u010C\u00C7\u1E08\u0187\u023B\uA73E]/g},
		{'base':'D', 'letters':/[\u0044\u24B9\uFF24\u1E0A\u010E\u1E0C\u1E10\u1E12\u1E0E\u0110\u018B\u018A\u0189\uA779]/g},
		{'base':'DZ','letters':/[\u01F1\u01C4]/g},
		{'base':'Dz','letters':/[\u01F2\u01C5]/g},
		{'base':'E', 'letters':/[\u0045\u24BA\uFF25\u00C8\u00C9\u00CA\u1EC0\u1EBE\u1EC4\u1EC2\u1EBC\u0112\u1E14\u1E16\u0114\u0116\u00CB\u1EBA\u011A\u0204\u0206\u1EB8\u1EC6\u0228\u1E1C\u0118\u1E18\u1E1A\u0190\u018E]/g},
		{'base':'F', 'letters':/[\u0046\u24BB\uFF26\u1E1E\u0191\uA77B]/g},
		{'base':'G', 'letters':/[\u0047\u24BC\uFF27\u01F4\u011C\u1E20\u011E\u0120\u01E6\u0122\u01E4\u0193\uA7A0\uA77D\uA77E]/g},
		{'base':'H', 'letters':/[\u0048\u24BD\uFF28\u0124\u1E22\u1E26\u021E\u1E24\u1E28\u1E2A\u0126\u2C67\u2C75\uA78D]/g},
		{'base':'I', 'letters':/[\u0049\u24BE\uFF29\u00CC\u00CD\u00CE\u0128\u012A\u012C\u0130\u00CF\u1E2E\u1EC8\u01CF\u0208\u020A\u1ECA\u012E\u1E2C\u0197]/g},
		{'base':'J', 'letters':/[\u004A\u24BF\uFF2A\u0134\u0248]/g},
		{'base':'K', 'letters':/[\u004B\u24C0\uFF2B\u1E30\u01E8\u1E32\u0136\u1E34\u0198\u2C69\uA740\uA742\uA744\uA7A2]/g},
		{'base':'L', 'letters':/[\u004C\u24C1\uFF2C\u013F\u0139\u013D\u1E36\u1E38\u013B\u1E3C\u1E3A\u0141\u023D\u2C62\u2C60\uA748\uA746\uA780]/g},
		{'base':'LJ','letters':/[\u01C7]/g},
		{'base':'Lj','letters':/[\u01C8]/g},
		{'base':'M', 'letters':/[\u004D\u24C2\uFF2D\u1E3E\u1E40\u1E42\u2C6E\u019C]/g},
		{'base':'N', 'letters':/[\u004E\u24C3\uFF2E\u01F8\u0143\u00D1\u1E44\u0147\u1E46\u0145\u1E4A\u1E48\u0220\u019D\uA790\uA7A4]/g},
		{'base':'NJ','letters':/[\u01CA]/g},
		{'base':'Nj','letters':/[\u01CB]/g},
		{'base':'O', 'letters':/[\u004F\u24C4\uFF2F\u00D2\u00D3\u00D4\u1ED2\u1ED0\u1ED6\u1ED4\u00D5\u1E4C\u022C\u1E4E\u014C\u1E50\u1E52\u014E\u022E\u0230\u00D6\u022A\u1ECE\u0150\u01D1\u020C\u020E\u01A0\u1EDC\u1EDA\u1EE0\u1EDE\u1EE2\u1ECC\u1ED8\u01EA\u01EC\u00D8\u01FE\u0186\u019F\uA74A\uA74C]/g},
		{'base':'OI','letters':/[\u01A2]/g},
		{'base':'OO','letters':/[\uA74E]/g},
		{'base':'OU','letters':/[\u0222]/g},
		{'base':'P', 'letters':/[\u0050\u24C5\uFF30\u1E54\u1E56\u01A4\u2C63\uA750\uA752\uA754]/g},
		{'base':'Q', 'letters':/[\u0051\u24C6\uFF31\uA756\uA758\u024A]/g},
		{'base':'R', 'letters':/[\u0052\u24C7\uFF32\u0154\u1E58\u0158\u0210\u0212\u1E5A\u1E5C\u0156\u1E5E\u024C\u2C64\uA75A\uA7A6\uA782]/g},
		{'base':'S', 'letters':/[\u0053\u24C8\uFF33\u1E9E\u015A\u1E64\u015C\u1E60\u0160\u1E66\u1E62\u1E68\u0218\u015E\u2C7E\uA7A8\uA784]/g},
		{'base':'T', 'letters':/[\u0054\u24C9\uFF34\u1E6A\u0164\u1E6C\u021A\u0162\u1E70\u1E6E\u0166\u01AC\u01AE\u023E\uA786]/g},
		{'base':'TZ','letters':/[\uA728]/g},
		{'base':'U', 'letters':/[\u0055\u24CA\uFF35\u00D9\u00DA\u00DB\u0168\u1E78\u016A\u1E7A\u016C\u00DC\u01DB\u01D7\u01D5\u01D9\u1EE6\u016E\u0170\u01D3\u0214\u0216\u01AF\u1EEA\u1EE8\u1EEE\u1EEC\u1EF0\u1EE4\u1E72\u0172\u1E76\u1E74\u0244]/g},
		{'base':'V', 'letters':/[\u0056\u24CB\uFF36\u1E7C\u1E7E\u01B2\uA75E\u0245]/g},
		{'base':'VY','letters':/[\uA760]/g},
		{'base':'W', 'letters':/[\u0057\u24CC\uFF37\u1E80\u1E82\u0174\u1E86\u1E84\u1E88\u2C72]/g},
		{'base':'X', 'letters':/[\u0058\u24CD\uFF38\u1E8A\u1E8C]/g},
		{'base':'Y', 'letters':/[\u0059\u24CE\uFF39\u1EF2\u00DD\u0176\u1EF8\u0232\u1E8E\u0178\u1EF6\u1EF4\u01B3\u024E\u1EFE]/g},
		{'base':'Z', 'letters':/[\u005A\u24CF\uFF3A\u0179\u1E90\u017B\u017D\u1E92\u1E94\u01B5\u0224\u2C7F\u2C6B\uA762]/g},
		{'base':'a', 'letters':/[\u0061\u24D0\uFF41\u1E9A\u00E0\u00E1\u00E2\u1EA7\u1EA5\u1EAB\u1EA9\u00E3\u0101\u0103\u1EB1\u1EAF\u1EB5\u1EB3\u0227\u01E1\u00E4\u01DF\u1EA3\u00E5\u01FB\u01CE\u0201\u0203\u1EA1\u1EAD\u1EB7\u1E01\u0105\u2C65\u0250]/g},
		{'base':'aa','letters':/[\uA733]/g},
		{'base':'ae','letters':/[\u00E6\u01FD\u01E3]/g},
		{'base':'ao','letters':/[\uA735]/g},
		{'base':'au','letters':/[\uA737]/g},
		{'base':'av','letters':/[\uA739\uA73B]/g},
		{'base':'ay','letters':/[\uA73D]/g},
		{'base':'b', 'letters':/[\u0062\u24D1\uFF42\u1E03\u1E05\u1E07\u0180\u0183\u0253]/g},
		{'base':'c', 'letters':/[\u0063\u24D2\uFF43\u0107\u0109\u010B\u010D\u00E7\u1E09\u0188\u023C\uA73F\u2184]/g},
		{'base':'d', 'letters':/[\u0064\u24D3\uFF44\u1E0B\u010F\u1E0D\u1E11\u1E13\u1E0F\u0111\u018C\u0256\u0257\uA77A\u00F0]/g},
		{'base':'dz','letters':/[\u01F3\u01C6]/g},
		{'base':'e', 'letters':/[\u0065\u24D4\uFF45\u00E8\u00E9\u00EA\u1EC1\u1EBF\u1EC5\u1EC3\u1EBD\u0113\u1E15\u1E17\u0115\u0117\u00EB\u1EBB\u011B\u0205\u0207\u1EB9\u1EC7\u0229\u1E1D\u0119\u1E19\u1E1B\u0247\u025B\u01DD]/g},
		{'base':'f', 'letters':/[\u0066\u24D5\uFF46\u1E1F\u0192\uA77C]/g},
		{'base':'g', 'letters':/[\u0067\u24D6\uFF47\u01F5\u011D\u1E21\u011F\u0121\u01E7\u0123\u01E5\u0260\uA7A1\u1D79\uA77F]/g},
		{'base':'h', 'letters':/[\u0068\u24D7\uFF48\u0125\u1E23\u1E27\u021F\u1E25\u1E29\u1E2B\u1E96\u0127\u2C68\u2C76\u0265]/g},
		{'base':'hv','letters':/[\u0195]/g},
		{'base':'i', 'letters':/[\u0069\u24D8\uFF49\u00EC\u00ED\u00EE\u0129\u012B\u012D\u00EF\u1E2F\u1EC9\u01D0\u0209\u020B\u1ECB\u012F\u1E2D\u0268\u0131]/g},
		{'base':'j', 'letters':/[\u006A\u24D9\uFF4A\u0135\u01F0\u0249]/g},
		{'base':'k', 'letters':/[\u006B\u24DA\uFF4B\u1E31\u01E9\u1E33\u0137\u1E35\u0199\u2C6A\uA741\uA743\uA745\uA7A3]/g},
		{'base':'l', 'letters':/[\u006C\u24DB\uFF4C\u0140\u013A\u013E\u1E37\u1E39\u013C\u1E3D\u1E3B\u017F\u0142\u019A\u026B\u2C61\uA749\uA781\uA747]/g},
		{'base':'lj','letters':/[\u01C9]/g},
		{'base':'m', 'letters':/[\u006D\u24DC\uFF4D\u1E3F\u1E41\u1E43\u0271\u026F]/g},
		{'base':'n', 'letters':/[\u006E\u24DD\uFF4E\u01F9\u0144\u00F1\u1E45\u0148\u1E47\u0146\u1E4B\u1E49\u019E\u0272\u0149\uA791\uA7A5]/g},
		{'base':'nj','letters':/[\u01CC]/g},
		{'base':'o', 'letters':/[\u006F\u24DE\uFF4F\u00F2\u00F3\u00F4\u1ED3\u1ED1\u1ED7\u1ED5\u00F5\u1E4D\u022D\u1E4F\u014D\u1E51\u1E53\u014F\u022F\u0231\u00F6\u022B\u1ECF\u0151\u01D2\u020D\u020F\u01A1\u1EDD\u1EDB\u1EE1\u1EDF\u1EE3\u1ECD\u1ED9\u01EB\u01ED\u00F8\u01FF\u0254\uA74B\uA74D\u0275]/g},
		{'base':'oi','letters':/[\u01A3]/g},
		{'base':'ou','letters':/[\u0223]/g},
		{'base':'oo','letters':/[\uA74F]/g},
		{'base':'p','letters':/[\u0070\u24DF\uFF50\u1E55\u1E57\u01A5\u1D7D\uA751\uA753\uA755]/g},
		{'base':'q','letters':/[\u0071\u24E0\uFF51\u024B\uA757\uA759]/g},
		{'base':'r','letters':/[\u0072\u24E1\uFF52\u0155\u1E59\u0159\u0211\u0213\u1E5B\u1E5D\u0157\u1E5F\u024D\u027D\uA75B\uA7A7\uA783]/g},
		{'base':'s','letters':/[\u0073\u24E2\uFF53\u00DF\u015B\u1E65\u015D\u1E61\u0161\u1E67\u1E63\u1E69\u0219\u015F\u023F\uA7A9\uA785\u1E9B]/g},
		{'base':'t','letters':/[\u0074\u24E3\uFF54\u1E6B\u1E97\u0165\u1E6D\u021B\u0163\u1E71\u1E6F\u0167\u01AD\u0288\u2C66\uA787]/g},
		{'base':'tz','letters':/[\uA729]/g},
		{'base':'u','letters':/[\u0075\u24E4\uFF55\u00F9\u00FA\u00FB\u0169\u1E79\u016B\u1E7B\u016D\u00FC\u01DC\u01D8\u01D6\u01DA\u1EE7\u016F\u0171\u01D4\u0215\u0217\u01B0\u1EEB\u1EE9\u1EEF\u1EED\u1EF1\u1EE5\u1E73\u0173\u1E77\u1E75\u0289]/g},
		{'base':'v','letters':/[\u0076\u24E5\uFF56\u1E7D\u1E7F\u028B\uA75F\u028C]/g},
		{'base':'vy','letters':/[\uA761]/g},
		{'base':'w','letters':/[\u0077\u24E6\uFF57\u1E81\u1E83\u0175\u1E87\u1E85\u1E98\u1E89\u2C73]/g},
		{'base':'x','letters':/[\u0078\u24E7\uFF58\u1E8B\u1E8D]/g},
		{'base':'y','letters':/[\u0079\u24E8\uFF59\u1EF3\u00FD\u0177\u1EF9\u0233\u1E8F\u00FF\u1EF7\u1E99\u1EF5\u01B4\u024F\u1EFF]/g},
		{'base':'z','letters':/[\u007A\u24E9\uFF5A\u017A\u1E91\u017C\u017E\u1E93\u1E95\u01B6\u0225\u0240\u2C6C\uA763]/g}
	];

	for(var i=0; i<defaultDiacriticsRemovalMap.length; i++) {
		str = str.replace(defaultDiacriticsRemovalMap[i].letters, defaultDiacriticsRemovalMap[i].base);
	}

	return str;
}

function hideUpdateNotice(){
	$("#frame_updatenotice").fadeOut(300);
}

function doUpdateNotice(){
	//If localStorage is not supported, hopefully this just throws an error on this function and doesn't break anything else
	var currentUpdate = parseInt($("#frame_updatenotice").attr("data-update"));
	var lastUpdate = localStorage.getItem("lastUpdateShown") || 0;
	if(lastUpdate<currentUpdate){
		localStorage.setItem("lastUpdateShown",currentUpdate);
		//Don't show the notification until the page is well-loaded
		setTimeout(function(){
			$("#frame_updatenotice").fadeIn(1000);
		}, 1000);
	}
}
