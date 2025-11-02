// ---------------------------------------------------------
// GLOBALS 
// ---------------------------------------------------------

var settings_index = [];
var stats_index = [];
var decks_index = [];
var cards_index = [];
var study_index = [];
var is_first_load = true;

// specify firebase credentials and identifiers
var firebase_config = {
  apiKey: 'AIzaSyAu2-341EtOigiNZ6qeAw_Tdjr51v_OtAQ',
  authDomain: 'learn-german-with-lucas.firebaseapp.com',
  databaseURL: 'https://learn-german-with-lucas-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'learn-german-with-lucas',
  storageBucket: 'learn-german-with-lucas.firebasestorage.app',
  messagingSenderId: '537448205963',
  appId: '1:537448205963:web:7059547256bfbe4261ce8e',
  measurementId: 'G-RXG0SDPQ6Y'
};

// connect to firebase with your project details
firebase.initializeApp(firebase_config);

// get a reference for the realtime database
var realtime_database = firebase.database();

// ---------------------------------------------------------
// START-UP 
// ---------------------------------------------------------

// initialise the app once the DOM ready
document.addEventListener('DOMContentLoaded', initialise_app);

async function initialise_app() {
  
  console.log("Initialising app");
  await index_database();
  await route();
  install_realtime_listener();
  console.log("Initialisation complete");

}

// listener for changes to the hash in the URL
window.addEventListener('hashchange', on_hash_change);

// function to handle hash changes
function on_hash_change() {
  console.log("Hash change detected, URL: " + window.location.hash);
  route();
}

// ---------------------------------------------------------
// START-UP TASKS 
// ---------------------------------------------------------

// manually sync the local database with the realtime database
async function index_database() {
  
  // log messages in the console
  console.log("Indexing database...");

  // get a live reference to the realtime database
  var snapshot = await realtime_database.ref('/').once('value');
  
  // store the snapshot  
  var db = snapshot.val();
  var decks_data = db?.decks || {};
  var cards_data = db?.cards || {};
  var stats_data = db?.stats || {};
  var settings_data = db?.settings || {};

  // build array (array_label: realtime_db_key)
  stats_index = Object.entries(stats_data).map(([realtime_id, realtime_object]) => ({
    unique_id: realtime_id,
    date: realtime_object.date,
    total: realtime_object.total,
    timestamp: realtime_object.timestamp
  }));

  // build array (array_label: realtime_db_key)
  decks_index = Object.entries(decks_data).map(([realtime_id, realtime_object]) => ({
    unique_id: realtime_id,
    deck_name: realtime_object.name,
    order: realtime_object.order,
    toggled: realtime_object.toggled
  }));

  // build array (array_label: realtime_db_key)
  cards_index = Object.entries(cards_data).map(([realtime_id, realtime_object]) => ({
    unique_id: realtime_id,
    deck: realtime_object.deck,
    question: realtime_object.question,
    answer: realtime_object.answer,
    score: realtime_object.score,
    is_flipped: realtime_object.flipped,
    last_reviewed: realtime_object.last_reviewed
  }));

  // build array (array_label: realtime_db_key)
  settings_index = {
  is_all_toggled: settings_data.is_all_toggled
};

  // log messages in the console
  console.log('Database synced & indexed: ' + get_current_time());
}

// route
async function route() {

  var current_hash = window.location.hash;
  var current_hash_id = get_hash_id();

  if (!current_hash || current_hash === "#" || current_hash === "#/") {
    // No hash? set default
    location.hash = "#/dashboard";
    return; // stop here, route() will run again automatically when hash changes
  }

  if (current_hash.includes('#/dashboard')) { 
    console.log('Hash includes #/dashboard');
    task_render_dashboard();
    load_scene('#/dashboard');
  }

  else if (current_hash.includes('#/decks/')) { 
    console.log('Hash includes #/decks/');
    task_render_deck(current_hash_id);
    load_scene('#/decks');
  }

  else if (current_hash.includes('#/study')) { 
    console.log('Hash includes #/study');
    render_study_scene(current_hash_id);
    load_scene('#/study');
  }

  else if (current_hash.includes('#/search')) { 
    console.log('Hash includes #/search');
    task_render_search();
    load_scene('#/search');
    searchbar.focus();
  }

  else { 
    console.log('No hash rule detected, loading default scene');
    task_render_dashboard();
    load_scene('#/dashboard');
  }
}

function install_realtime_listener() {
  
  // log messages in the console
  console.log("Installing realtime listener");
  
  // connect listener to database
  realtime_database.ref("/").on("value", (snapshot) => {
    const data = snapshot.val();
    
    // if just installed, do not refresh
    if (is_first_load === true) {is_first_load = false;}
    
    // else perform these actions when triggered
    else {refresh();}

  });
}

// fucntion to refresh user interface
async function refresh() {

  // log messages in the console
  console.log("Database updated...");

  // perform tasks
  await index_database();
  //await route();

}

// ---------------------------------------------------------
// LISTENERS 2.0
// ---------------------------------------------------------

// listen for clicks on action elements and perform the relavent action
document.addEventListener('click', function(event) {

  // find the clicked control
  var target = event.target.closest('[data-action]'); if (!target) return;

  // admin actions
  if (target.dataset.action === 'action_debug') {action_debug();}
  if (target.dataset.action === 'action_toggle_dev_mode') {action_toggle_dev_mode();}

  // study actions
  if (target.dataset.action === 'action_practice_default') {action_practice_default();}
  if (target.dataset.action === 'action_practice_deck') {action_practice_deck();}
  if (target.dataset.action === "action_study_card") {action_study_card(target);}
  if (target.dataset.action === 'action_practice_random') {action_practice_random();}
  if (target.dataset.action === 'action_practice_mastery') {action_practice_mastery();}
  if (target.dataset.action === 'action_practice_oldest') {action_practice_oldest();}

  // add, edit and delete actions
  if (target.dataset.action === 'action_add_deck') {action_add_deck();}
  if (target.dataset.action === 'action_delete_deck') {action_delete_deck();}
  if (target.dataset.action === 'action_add_card') {action_add_card();}
  if (target.dataset.action === "action_delete_card") {action_delete_card(target)}

  // ui & state change actions
  if (target.dataset.action === "action_toggle_deck") {action_toggle_deck(target);}
  if (target.dataset.action === 'action_toggle_all') {action_toggle_all();}
  if (target.dataset.action === 'action_toggle_dev_mode') {action_toggle_dev_mode();}
  if (target.dataset.action === 'action_toggle_modes_on') {action_toggle_modes_on();}
  if (target.dataset.action === 'action_toggle_modes_off') {action_toggle_modes_off();}
  
  // navigation actions
  if (target.dataset.action === 'action_goto_search') {action_goto_search();} 
  if (target.dataset.action === 'action_goto_dashboard') {action_goto_dashboard();}
  if (target.dataset.action === 'action_back') {action_back();}

});

// listen for focus events on elements and perform the relavent action
document.addEventListener('focusin', function(event) {

  // find the clicked control
  var target = event.target.closest('[data-action]'); if (!target) return;

  if (target.dataset.action === "action_edit_question") {action_edit_question(target)}
  if (target.dataset.action === "action_edit_answer") {action_edit_answer(target)}

});

// ---------------------------------------------------------
// ACTIONS 2.0
// ---------------------------------------------------------

function action_debug() {
  console.log('Debugging');
}

function action_practice_default() {
  console.log('Action: Practice Default');
  create_study_index_for_default();
  location.hash = '#/study/0/' + study_index[0].unique_id;
}

function action_practice_deck() {
  console.log('Action: Practice Deck');
  create_study_index_for_deck();
  location.hash = '#/study/0/' + study_index[0].unique_id;
}

function action_practice_random() {
  console.log('Action: Practice Random');
  create_study_index_for_random();
  location.hash = '#/study/0/' + study_index[0].unique_id;
}

function action_practice_mastery() {
  console.log('Action: Practice Random');
  create_study_index_for_mastery();
  location.hash = '#/study/0/' + study_index[0].unique_id;
}

function action_practice_oldest() {
  console.log('Action: Practice Random');
  create_study_index_for_oldest();
  location.hash = '#/study/0/' + study_index[0].unique_id;
}

async function action_add_deck() {
  console.log('Action: Add Deck');
  await task_add_deck();
  task_render_dashboard();
}

function action_delete_deck() {
  console.log('Action: Delete Deck');
  task_delete_deck(get_hash_id());
  location.hash = '#/dashboard';
}

async function action_add_card() {
  console.log('Action: Add Deck');
  await task_add_card();
  task_render_deck(get_hash_id());
}

async function action_delete_card(target) {
  console.log('Action: Delete Card');
  await task_delete_card(target);
  task_render_deck(get_hash_id());
}

function action_back() {
  console.log('Action: Back');
  window.history.back();
}

function action_toggle_deck(target) {
  task_toggle_deck(target);
}

function action_toggle_all() {
  console.log('Action: Toggle All');
  task_toggle_all()
}

function action_toggle_modes_on() {
  task_toggle_modes_on();
}

function action_toggle_modes_off() {
  task_toggle_modes_off();
}

function action_toggle_dev_mode() {
  console.log('Action: Dev Mode');
  task_toggle_dev_mode();
}

function action_goto_search() {
  console.log('Action: Go To Search');
  location.hash = '#/search';
}

function action_goto_dashboard() {
  console.log('Action: Go To Dashbaord');
  location.hash = '#/dashboard';
}

function action_edit_question(target) {
  task_edit_question(target);
}

function action_edit_answer(target) {
  task_edit_answer(target);
}

// listen for clicks on the study card button
function action_study_card(target) {
  task_study_card(target);
}

// ---------------------------------------------------------
// TASKS 2.0 
// ---------------------------------------------------------

// function to toggle dev mode on and off
function task_toggle_dev_mode() {

  var menu_ref = document.getElementById('dev_menu');

  if (menu_ref.classList.contains('dev_menu_hidden')) {
    menu_ref.classList.remove('dev_menu_hidden');
    menu_ref.classList.add('dev_menu_visible');
  } 
  
  else {
    menu_ref.classList.remove('dev_menu_visible');
    menu_ref.classList.add('dev_menu_hidden');
  }

}

// function to toggle all deck checkboxes (on or off)
function task_toggle_all() {
  
  // collect all elements that contain a deck toggle input
  var toggles_ref = Array.from(document.querySelectorAll('.dynamic_list_decks input[type="checkbox"]'));
  
  // 3. Determine the current state
  var allChecked = toggles_ref.every(input => input.checked);
  var noneChecked = toggles_ref.every(input => !input.checked);
  var someChecked = !allChecked && !noneChecked;

  if (allChecked) {
    // All checked → uncheck all
    toggles_ref.forEach(t => { if (t.checked) t.click(); });
    task_edit_setting('is_all_toggled', false);
    document.querySelector('#toggle_all input[type="checkbox"]').checked = false;
    console.log('All were checked → all unchecked');
  } 
  
  else if (someChecked) {
    // Some checked → check the rest
    toggles_ref.forEach(t => { if (!t.checked) t.click(); });
    task_edit_setting('is_all_toggled', true);
    document.querySelector('#toggle_all input[type="checkbox"]').checked = true;
    console.log('Some were checked → now all checked');
  } 
  
  else if (noneChecked) {
    // None checked → check all
    toggles_ref.forEach(t => { if (!t.checked) t.click(); });
    task_edit_setting('is_all_toggled', true);
    document.querySelector('#toggle_all input[type="checkbox"]').checked = true;
    console.log('None were checked → all checked');
  }
}

// listen for click events on cards
function task_edit_question(target) {
  
  // get a reference to the parent container
  var item_ref = target.closest('.card_snippet_wrapper');

  // get a reference to the parent containers id
  var unique_id = item_ref.dataset.id;

  // log messages in the console
  console.log("Question was clicked: " + unique_id);
  
  // listen for offfocus
  target.addEventListener('focusout', focusout);
  
  // on de-focus
  function focusout(event) {
    target.removeEventListener('focusout', focusout);
    task_edit_card(unique_id, {question: target.textContent});
    console.log("Question was edited: " + target.textContent);
  }

}

// listen for click events on cards
function task_edit_answer(target) {
  
  // get a reference to the parent container
  var item_ref = target.closest('.card_snippet_wrapper');

  // get a reference to the parent containers id
  var unique_id = item_ref.dataset.id;

  // log messages in the console
  console.log("Answer was clicked: " + unique_id);
  
  // listen for offfocus
  target.addEventListener('focusout', focusout);
  
  // on de-focus
  function focusout(event) {
    target.removeEventListener('focusout', focusout);
    task_edit_card(unique_id, {answer: target.textContent});
    console.log("Answer was edited: " + target.textContent);
  }

}

// listen for clicks on the study card button
function task_study_card(target) {

  // get a reference to the parent items ID
  var unique_id = target.closest('.card_snippet_wrapper').dataset.id;

  // log messages in the console
  console.log('studying card: ' + unique_id);

  // create study index
  create_study_index_for_card(unique_id);
  location.hash = '#/study/0/' + study_index[0].unique_id;
}

function task_toggle_deck(target) {
  var unique_id = target.closest('.deck_snippet_wrapper').dataset.id; // find the parent container of the clicked item
  console.log('deck toggled: ' + target.checked + ' (' + unique_id + ')');
  task_edit_setting('is_all_toggled', false);
  task_edit_deck(unique_id, {toggled: target.checked});
}

function task_toggle_modes_on() {
  document.getElementById('btn_toggle_modes_on').style.display = 'none';
  document.getElementById('btn_toggle_modes_off').style.display = 'flex';
  document.getElementById('list_study_modes').style.display = 'flex';
}

function task_toggle_modes_off() {
  document.getElementById('btn_toggle_modes_on').style.display = 'flex';
  document.getElementById('btn_toggle_modes_off').style.display = 'none';
  document.getElementById('list_study_modes').style.display = 'none';
}

// ---------------------------------------------------------
// LISTENERS 
// ---------------------------------------------------------

// listener to pushes changes to deck names to realtime database
document.getElementById('deck_title').addEventListener('dblclick', event => {
  
  // log messages in the console
  console.log("editing deck name"); 

  // store the current event target for ease of access
  var element_to_modify = event.currentTarget;
  
  // restyle the event target
  element_to_modify.contentEditable = "true";
  element_to_modify.style.background = "#54555D";
  element_to_modify.style.padding = "0 12px"
  element_to_modify.focus();

  // add event listeners for de-focus and enter
  element_to_modify.addEventListener('keydown', on_keydown);
  element_to_modify.addEventListener('blur', on_blur);

  // funtion to run when user hits enter
  function on_keydown(event) {
    if (event.key !== 'Enter') return; // ignore everything else
    event.preventDefault();
    element_to_modify.blur();
    element_to_modify.removeEventListener('keydown', on_keydown);
  }

  // funtion to run when user de-focusses the input
  function on_blur(event) {
    element_to_modify.style.removeProperty("background");
    element_to_modify.style.removeProperty("padding");
    element_to_modify.contentEditable = "false";
    task_edit_deck(get_hash_id(), {name:element_to_modify.textContent});
    element_to_modify.removeEventListener('blur', on_blur);
  }

});

// listen for events on an element and execute code
document.getElementById('btn_reveal').addEventListener("click", function() {
  console.log("revealing card");
  document.getElementById('btn_reveal').style.display = "none";
  document.getElementById('btn_rate').style.display = "flex";
  document.getElementById('studycard_answer').style.display = "flex";
  document.getElementById('studycard_instructions').textContent = "How well did you know this?";
  
  var hash_id = get_hash_id();
  var card = cards_index.find(item => item.unique_id === hash_id);
  task_speak_german(card.answer);
});

// listen for events on an element and execute code
document.getElementById('btn_rate').addEventListener('click', function(event) {

  play_success();

  document.getElementById('btn_reveal').style.display = "block";
  document.getElementById('btn_rate').style.display = "none";
  document.getElementById('studycard_answer').style.display = "none";
  document.getElementById('studycard_instructions').textContent = "Reveal answer";

  // Find the clicked control, even if an icon or span inside the button was clicked
  var target = event.target.closest('[data-action]');
  
  // guard agianst null clicks
  if (!target) return;
  
  // determine the correct action
  var score = 0;

  if (target.dataset.action === "rate_card_1") {score = 1;}
  if (target.dataset.action === "rate_card_2") {score = 2;}
  if (target.dataset.action === "rate_card_3") {score = 3;}
  if (target.dataset.action === "rate_card_4") {score = 4;}
  if (target.dataset.action === "rate_card_5") {score = 5;}

  var card_ref = filter_array_by_property(cards_index, 'unique_id', get_hash_id());
  var card_is_flipped = card_ref[0].is_flipped;
  
  if (card_is_flipped === false) {
    console.log("Card Flipped was False, Flipping Card");
    card_is_flipped = true;
  }

  else if (card_is_flipped === true) {
    console.log("Card Flipped was True, Unflipping Card");
    card_is_flipped = false;
  }

  else {
    console.log("Card Flipped was Unavailable, Flipping Card for Next Run");
    card_is_flipped = true;
  }

  task_edit_card(card_ref[0].unique_id, { flipped: card_is_flipped, score: score, last_reviewed: Date.now() });
  iterate_study_scene();
  update_stats();

});

// function to iterate the study scene through the study_index
async function iterate_study_scene() {
  console.log('Iterating Study Scene');

  var hash = window.location.hash;
  var match = hash.match(/#\/study\/(\d+)\/[-\w]+/);
  var iteration = match ? Number(match[1]) : null;

  console.log('Current Iteration: ' + iteration);

  var next_iteration = iteration + 1;

  console.log('Next Iteration: ' + next_iteration);

  if (next_iteration === 10 || study_index[next_iteration] === undefined) {
    console.log('Session Complete');
    location.hash = '#/dashboard';
  }

  else {location.hash = '#/study/' + next_iteration + '/' + study_index[next_iteration].unique_id;}
}

// ---------------------------------------------------------
// RENDER FUNCTIONS 
// ---------------------------------------------------------

// function which loads specified scene and hides all others
function load_scene(scene_to_load) {
 
  // Find the scene element
  var scene_element = document.getElementById(scene_to_load);

  // Hide all scenes
  var scenes = document.querySelectorAll(".scene");
  for (var i = 0; i < scenes.length; i++) {scenes[i].style.display = "none";}

  // Show the requested scene
  scene_element.style.display = "block";

  // log messages in the console
  console.log('loading scene: ' + scene_to_load);
}

// function to render decks list
function task_render_dashboard() {
  
  // show messages in the console
  console.log('rendering dashboard');

  document.getElementById('scene_sync_date').innerText = 'synced ' + get_current_time();
  document.getElementById('metric_streak').textContent = get_daily_streak();
  document.getElementById('metric_total_studied').textContent = get_cards_studied_total();
  document.getElementById('metric_7_day_avg').textContent = get_average_last_7_days();
  document.getElementById('metric_30_day_avg').textContent = get_average_last_30_days();

  var all_cards_total = cards_index.length;
  var all_total_score = cards_index.reduce((total, item) => total + item.score, 0);
  var all_mastery = ((all_total_score / (all_cards_total * 5))*100).toFixed(1);
  document.getElementById('data_all_card_count').textContent = all_cards_total + ' cards' + ' • ' + all_mastery + '%'; // set count
  if (settings_index.is_all_toggled === true) { document.querySelector('#toggle_all input[type="checkbox"]').checked = true;  }
  else if (settings_index.is_all_toggled === false) { document.querySelector('#toggle_all input[type="checkbox"]').checked = false;  }

  // select the element to render inside
  var dynamic_list_decks = document.getElementById('dynamic_list_decks');

  // ensure the element has an innerhtml property
  dynamic_list_decks.innerHTML = null;

  var decks_index_temp = Array.from(decks_index);

  // sort the array before looping through
  decks_index_temp.sort((item_1, item_2) => item_1.order - item_2.order);

  // specify array to loop through and perform actions
  decks_index_temp.forEach (function (list_item) {

      // insert html template
      dynamic_list_decks.insertAdjacentHTML("beforeend", deck_snippet);
        
      // grab the element just inserted
      var snippet = dynamic_list_decks.lastElementChild;

      // fill its fields
      snippet.querySelector(".deck_snippet_button_wrapper").href = '#/decks/' + list_item.deck_name + '/' + list_item.unique_id; // set hash
      snippet.setAttribute('data-id', list_item.unique_id); // set id
      snippet.querySelector(".deck_snippet_name").textContent = list_item.deck_name; // set deck name
      
      var deck_index = cards_index.filter(item => item.deck.includes(list_item.unique_id));
      var total_cards = deck_index.length;
      var total_score = deck_index.reduce((total, item) => total + item.score, 0);
      var mastery = ((total_score / (total_cards * 5))*100).toFixed(0);

      snippet.querySelector(".deck_snippet_count").textContent = total_cards + ' cards' + ' • ' + mastery + '%'; // set count

      //snippet.querySelector(".deck_snippet_count").textContent = cards_index.filter(item => item.deck.includes(list_item.unique_id)).length + ' cards'; // set count

      if (list_item.toggled === true) { snippet.querySelector('input[type="checkbox"]').checked = true;  }
      else if (list_item.toggled === false) { snippet.querySelector('input[type="checkbox"]').checked = false;  }
    }
  );
}

// function to render cards list
function task_render_deck(deck_id_to_render) {

  // show messages in the console
  console.log('rendering cards list for: ' + deck_id_to_render);

  // render page details
  document.getElementById('deck_title').innerText = filter_array_by_property(decks_index , 'unique_id' , deck_id_to_render)[0].deck_name;
  document.getElementById('deck_status').innerText = cards_index.filter(item => item.deck.includes(deck_id_to_render)).length + ' cards';

  // select the element to render inside
  var dynamic_list_cards = document.getElementById('dynamic_list_cards');
  
  // ensure the element has an innerhtml property
  dynamic_list_cards.innerHTML = null;

  // specify array to loop through and perform actions
  cards_index.filter(item => item.deck.includes(deck_id_to_render)).forEach (
      
    // specify the actions to perform on each list item
    function (list_item) {

      // insert html template
      dynamic_list_cards.insertAdjacentHTML("beforeend", card_snippet);
        
      // grab the element just inserted
      var snippet = dynamic_list_cards.lastElementChild;

      // fill its fields
      snippet.setAttribute('data-id', list_item.unique_id); // set id
      snippet.querySelector(".card_snippet_question").innerText = list_item.question; // set question
      snippet.querySelector(".card_snippet_answer").innerText = list_item.answer; // // set answer

      if (list_item.score === 0) {snippet.style.borderTop = "3px solid #54555D"}
      if (list_item.score === 1) {snippet.style.borderTop = "3px solid #C34A3F"}
      if (list_item.score === 2) {snippet.style.borderTop = "3px solid #EE8343"}
      if (list_item.score === 3) {snippet.style.borderTop = "3px solid #F6DA39"}
      if (list_item.score === 4) {snippet.style.borderTop = "3px solid #7FAC3A"}
      if (list_item.score === 5) {snippet.style.borderTop = "3px solid #43ACD9"}

    }
  );
}

// function to render cards list
function render_study_scene(card_id_to_render) {

  // show messages in the console
  console.log('rendering study scene for: ' + card_id_to_render);

  var title = document.getElementById('study_scene_title');
  var question = document.getElementById('studycard_question_content');
  var answer = document.getElementById('studycard_answer_content');
  var button_parent = document.getElementById('btn_reveal');
  var button_actual = button_parent.querySelector('.button_primary');
  var card = cards_index.find(item => item.unique_id === card_id_to_render);
  var card_wrap = document.querySelector('.studycard_snippet');

  title.textContent = "Study";
      
  if (card.is_flipped === false) {
    console.log("English First!");
    question.textContent = card.question;
    answer.textContent = card.answer;
        
  } else if (card.is_flipped === true) {
    console.log("German First!");
    question.textContent = card.answer;
    answer.textContent = card.question;
  }

  else {
    console.log("No Sides Detected");
    question.textContent = card.question;
    answer.textContent = card.answer;
  }

  if (card.score === 0) {button_actual.style.backgroundColor = "#54555D"}
  if (card.score === 1) {button_actual.style.backgroundColor = "#C34A3F"}
  if (card.score === 2) {button_actual.style.backgroundColor = "#EE8343"}
  if (card.score === 3) {button_actual.style.backgroundColor = "#F6DA39"}
  if (card.score === 4) {button_actual.style.backgroundColor = "#7FAC3A"}
  if (card.score === 5) {button_actual.style.backgroundColor = "#43ACD9"}

  if (card.score === 0) {card_wrap.style.boxShadow = "inset 0 4px 0 #54555D"}
  if (card.score === 1) {card_wrap.style.boxShadow = "inset 0 4px 0 #C34A3F"}
  if (card.score === 2) {card_wrap.style.boxShadow = "inset 0 4px 0 #EE8343"}
  if (card.score === 3) {card_wrap.style.boxShadow = "inset 0 4px 0 #F6DA39"}
  if (card.score === 4) {card_wrap.style.boxShadow = "inset 0 4px 0 #7FAC3A"}
  if (card.score === 5) {card_wrap.style.boxShadow = "inset 0 4px 0 #43ACD9"}

}

// ---------------------------------------------------------
// TASKS: UPDATE DATABASE
// ---------------------------------------------------------

// function to add an item into the database
async function task_add_deck() {
  
  // get a reference to the database
  var item_ref = realtime_database.ref('decks');

  // push a new item (firebase will give it a unique ID)
  item_ref.push({
    name: 'New Deck',
    order: 999,
    toggled: true
  });

  // show messages in the console
  console.log('New deck added');
}

// function to update a card in the database
function task_edit_deck(unique_id, fields_to_update) {
  
  // get a reference to the card in the database
  var item_ref = realtime_database.ref('decks/' + unique_id);
  
  // update any and all feilds
  item_ref.update(fields_to_update);

  // log messages in the console
  console.log(`deck ${unique_id} updated:`, fields_to_update);
}

// function to delete a deck from the Realtime Database by its unique ID
function task_delete_deck(unique_id) {

  //build a reference to the specific card you want to delete
  var deck_ref = realtime_database.ref('decks/' + unique_id);

  // remove it from the database
  deck_ref.remove();
  
  var cards_to_delete = cards_index.filter(item => item.deck === unique_id);

  cards_to_delete.forEach(function(item) {
    var card_ref = realtime_database.ref('cards/' + item.unique_id);
    card_ref.remove();
  });
}

// function to add an item into the database
async function task_add_card() {
  
  // get a reference to the database
  var item_ref = realtime_database.ref('cards');

  // push a new item (firebase will give it a unique ID)
  item_ref.push({
    deck: get_hash_id(),
    question: "",
    answer: "",
    score: 0,
    last_reviewed: Date.now()
  });

  // show messages in the console
  console.log('new card added:');
}

// function to update a card in the database
function task_edit_card(unique_id, fields_to_update) {
  
  // get a reference to the card in the database
  var item_ref = realtime_database.ref('cards/' + unique_id);
  
  // update any and all feilds
  item_ref.update(fields_to_update);

  // log messages in the console
  console.log(`card ${unique_id} updated:`, fields_to_update);
}

// function to delete a card from the Realtime Database by its unique ID
async function task_delete_card(target) {

  var unique_id = target.closest('.card_snippet_wrapper').dataset.id; // find the parent container of the clicked item

  //build a reference to the specific card you want to delete
  var card_ref = realtime_database.ref('cards/' + unique_id);

  // remove it from the database
  card_ref.remove();
}

// function to update a setting in the database
function task_edit_setting(setting_to_update, new_value) {
  
  // get a reference to the card in the database
  var item_ref = realtime_database.ref('settings');
  
  // update any and all feilds
  item_ref.update({ [setting_to_update]: new_value });

  // log messages in the console
  console.log('Setting ' + setting_to_update + ' updated: ' + new_value);
}

// ---------------------------------------------------------
// TASKS: AUDIO
// ---------------------------------------------------------

// Preload the audio files
var audio_success = new Audio('sounds/success.mp3'); audio_success.preload = 'auto'; audio_success.load();
var audio_fail = new Audio('sounds/failure2.mp3'); audio_fail.preload = 'auto'; audio_fail.load();

function play_success() {
    audio_success.currentTime = 0;
    audio_success.play();
}

function play_fail() {
    audio_fail.currentTime = 0;
    audio_fail.play();
}

// ---------------------------------------------------------
// TASKS: METRICS
// ---------------------------------------------------------

async function update_stats() {
  
  var database_ref = realtime_database.ref('stats'); // get a reference to the database
  var date_ref = get_timestamp(); //get a reference to todays date
  var stats_ref = stats_index.find(item => item.timestamp === date_ref); // get a reference to todays stats
  
  // if stats for today exist, increment the total
  if (stats_ref) {
    console.log('Updating Stats: ' + get_current_date());
    var item_ref = realtime_database.ref('stats/' + stats_ref.unique_id);
    var existing_total = stats_ref.total;
    item_ref.update({
      date: get_current_date(),
      total: existing_total + 1,
      timestamp: get_timestamp()
    });
  }

  // if stats for today do not exist, create a new entry
  else {
    console.log('Creating New Stats: ' + get_current_date());
    database_ref.push({
      date: get_current_date(),
      total: 1,
      timestamp: get_timestamp()
    });
  }

}

// ---------------------------------------------------------
// HELPERS: METRICS
// ---------------------------------------------------------

// function to get the current total for cards studied
function get_cards_studied_total() {
  
  // set varible to store value
  var studied_total = null;

  // get a reference to the currents date object in the realtime db
  var date_ref = stats_index.find( item => item.timestamp === get_timestamp() );
 
  // if there is no date object in the realtime db, set to 0
  if (date_ref === undefined) {studied_total = 0}

  // else get the current running total
  else {studied_total = date_ref.total;}

  // log messages in the console
  console.log("Total Cards Studied (Today):", studied_total);

  // return result
  return studied_total;
}

function get_average_last_7_days() {

  // get a reference to todays timestamp
  var today = get_timestamp();
  
  // get a reference for the number of days to calculate
  var timeframe = 7;

  // get a reference for the total sum
  var total_sum = 0;

  // Loop over the last 7 days (including today)
  for (var i = 0; i < timeframe; i++) {

    // Calculate timestamp for each previous day
    var date_ref = today - (i * 24 * 60 * 60 * 1000);

    // Try to find a matching record in stats_index
    var item_ref = stats_index.find(function(item) {
      return item.timestamp === date_ref;
    });

    // If found, use its total; otherwise, count 0
    var daily_total = item_ref ? item_ref.total : 0;

    total_sum += daily_total;
  }

  // Calculate average
  var average_last_7_days = Math.round(total_sum / timeframe);
  console.log("Average cards studied (last 7 days):", average_last_7_days);
  return average_last_7_days;
}

function get_average_last_30_days() {

  // get a reference to todays timestamp
  var today = get_timestamp();
  
  // get a reference for the number of days to calculate
  var timeframe = 30;

  // get a reference for the total sum
  var total_sum = 0;

  // Loop over the last 7 days (including today)
  for (var i = 0; i < timeframe; i++) {

    // Calculate timestamp for each previous day
    var date_ref = today - (i * 24 * 60 * 60 * 1000);

    // Try to find a matching record in stats_index
    var item_ref = stats_index.find(function(item) {
      return item.timestamp === date_ref;
    });

    // If found, use its total; otherwise, count 0
    var daily_total = item_ref ? item_ref.total : 0;

    total_sum += daily_total;
  }

  // Calculate average
  var average_last_30_days = Math.round(total_sum / timeframe);
  console.log("Average cards studied (last 30 days):", average_last_30_days);
  return average_last_30_days;
}

// function to calculate the daily streak
function get_daily_streak() {

  // Reference to today's timestamp
  var today = get_timestamp();

  // Counter for consecutive days
  var consecutive_days = 0;

  // We'll iterate backwards indefinitely until a null day is found
  for (var i = 0; ; i++) {
    // Calculate timestamp for each previous day
    var date_ref = today - (i * 24 * 60 * 60 * 1000);

    // Try to find a matching record in stats_index
    var item_ref = stats_index.find(function(item) {
      return item.timestamp === date_ref;
    });

    // Check if a total exists
    if (item_ref && item_ref.total != null) {
      consecutive_days++;
    } else {
      // Stop counting when we reach a null or missing day
      break;
    }
  }
  
  console.log("Streak:", consecutive_days);
  return consecutive_days;
}

// ---------------------------------------------------------
// HELPERS: GLOBAL
// ---------------------------------------------------------

// helper to filter an array by a property type and its value
function filter_array_by_property(array, property, value) {
  return array.filter(item => item[property] == value);
}

// Function to fetch the current timestamp
function get_current_time() {
  
  // create variable to store date-time object
  var now = new Date();

  // specify custom formatting for date-time object
  var format = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };
   
  //reutrn the formatted date-time object
  return new Intl.DateTimeFormat('en-AU', format).format(now).toLowerCase(); 
}

// helper to fetch todays date (formatted: 0000-00-00)
function get_current_date() {
  var new_date = new Date();
  var year = new_date.getFullYear();
  var month = new_date.getMonth() + 1;
  var day = new_date.getDate();
  if (month < 10) month = '0' + month;
  if (day < 10) day = '0' + day;
  return `${year}-${month}-${day}`;
}

// helper to fetch todays date as a timestamp (unformatted)
function get_timestamp() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const midnight = new Date(y, m, d);
  return midnight.getTime();
}

// function to to speak aloud a string in german
function task_speak_german(text_to_speak) {
  speechSynthesis.cancel();
  var utterance = new SpeechSynthesisUtterance(text_to_speak);
  utterance.lang = "de-DE";
  utterance.rate = 1.0;    // default is 1, range is 0.1 to 10
  speechSynthesis.speak(utterance);
}

function get_hash_id() {
  // Step 1: Get the current hash part of the URL ("#/decks/deck_name/unique_id")
  var hash = window.location.hash; 

  // Step 2: Remove the '#' at the start ("/decks/deck_name/unique_id")
  var parsed_hash = hash.startsWith('#') ? hash.slice(1) : hash;

  // Step 3: Split the hash into parts using '/' (["", "decks", "deck_name", "unique_id"])
  var parts = parsed_hash.split('/');

  // Step 4: The unique_id should be the last item in this array
  var current_hash_id = parts[parts.length - 1];

  return current_hash_id;
}

// ---------------------------------------------------------
// DRAG & DROP
// ---------------------------------------------------------

// This variable will store the item being dragged
var dragged_item = null;
var dragged_over_item = null;


// fires when you start dragging
document.getElementById('dynamic_list_decks').addEventListener('dragstart', function(drag_event) {
	
	// determine the target of the drag
	dragged_item = drag_event.target.closest('.deck_snippet_wrapper');
	
	// add a class to the dragged item
	dragged_item.classList.add('dragging');

	// log messages in the console
	console.log('dragstart');

});


// fires when you stop dragging
document.getElementById('dynamic_list_decks').addEventListener('dragend', function(drag_event) {

	// add a class to the dragged item
	dragged_item.classList.remove('dragging');

	// dragged_over_item.classList.remove('drop-above', 'drop-below');

	// log messages in the console
	console.log('dragend');

});

//  fires when you drag over an item
document.getElementById('dynamic_list_decks').addEventListener('dragover', function(drag_event) {
	
	// Prevent default behavior
	drag_event.preventDefault();

	// determine the target of the drag
	dragged_over_item = drag_event.target.closest('.deck_snippet_wrapper');

	// Calculate if mouse is in top half or bottom half of the item
	var rect = dragged_over_item.getBoundingClientRect();
	var mouseY = drag_event.clientY;
	var itemMiddle = rect.top + (rect.height / 2);

	// Remove old classes from all items first
	var allItems = document.querySelectorAll('.deck_snippet_wrapper');
	allItems.forEach(function(item) {
		item.classList.remove('drop-above', 'drop-below');
	});

	// Don't do anything if dragging over itself or if target is null
	if (!dragged_over_item || dragged_over_item === dragged_item) return;

	// Add appropriate class based on mouse position
	if (mouseY < itemMiddle) {
		// Mouse is in top half - will drop ABOVE this item
		dragged_over_item.classList.add('drop-above');
	} else {
		// Mouse is in bottom half - will drop BELOW this item
		dragged_over_item.classList.add('drop-below');
	}

});

// fires when you release the mouse to drop
document.getElementById('dynamic_list_decks').addEventListener('drop', function(drag_event) {
	
	// Prevent default behavior
	drag_event.preventDefault();

	// determine the target of the drop
	var dropped_over_item = drag_event.target.closest('.deck_snippet_wrapper');

	// // remove a class from the dropped item
	 dropped_over_item.classList.remove('drop-above', 'drop-below');

	// Don't do anything if dropping over itself or if target is null
	if (!dropped_over_item || dropped_over_item === dragged_item) return;

	// function to run on drop
	render_new_order(dropped_over_item, drag_event);
	collect_new_order();

	// log messages in the console
	console.log('drop');

});

// helper function to reorder the items
function render_new_order(dropped_over_item, drag_event) {
	
	// Calculate if we should insert above or below
	var rect = dropped_over_item.getBoundingClientRect();
	var mouseY = drag_event.clientY;
	var itemMiddle = rect.top + (rect.height / 2);
	var insertAbove = mouseY < itemMiddle;
	
	if (insertAbove) {
		// Insert before the target
		dropped_over_item.parentNode.insertBefore(dragged_item, dropped_over_item);
	} else {
		// Insert after the target
		dropped_over_item.parentNode.insertBefore(dragged_item, dropped_over_item.nextSibling);
	}
	
}

// Function to collect the new order and send to database
function collect_new_order() {
  
	// find the parent element that contains all the items
	var dynamic_list_decks = document.getElementById('dynamic_list_decks');
	  
	// get all child items inside that parent (only those with the given class)
	var deck_snippet_wrapper = dynamic_list_decks.querySelectorAll('.deck_snippet_wrapper');
  
	// create an empty array to hold the results
	var orderWithPositions = [];
  
	// loop through each item and add an object with {id, position}
	deck_snippet_wrapper.forEach(function(item, index) {
		var id = item.getAttribute('data-id');
		orderWithPositions.push({
			id: id,
			position: index
		});
	});

	// loop through each item and add an object with {id, position}
	orderWithPositions.forEach(function(item) {
		console.log('Updating Deck: ' + item.id + ' at position ' + item.position);
    
    // test code to update the positions in the database
    task_edit_deck(item.id, {order: item.position});

	});
	
	// 5. Print the result to the console
	console.log('Order with positions:', orderWithPositions);

}

// ---------------------------------------------------------
// TASKS: STUDY INDEX 
// ---------------------------------------------------------

function create_study_index_for_deck() {
  
  // log messages in the console
  console.log('Building Study Index');

  // reset globals
  study_index = [];
  var candidates = filter_array_by_property(cards_index, 'deck', get_hash_id());

  // sort and filter
  candidates = sort_by_score_then_date(candidates);
  splice_and_push(5, candidates, study_index);
  candidates = sort_by_last_reviewed(candidates);
  splice_and_push(5, candidates, study_index);
  study_index = randomise_order(study_index);

  // log messages in the console
  console.log('Study Index Complete: ', study_index);

}

function create_study_index_for_card(unique_id) {
  
  // log messages in the console
  console.log('Building Study Index');

  // reset globals
  study_index = [];
  study_index = filter_array_by_property(cards_index, 'unique_id', unique_id);

  // log messages in the console
  console.log('Study Index Complete: ', study_index);

}

function create_study_index_for_random() {
  
  // log messages in the console
  console.log('Building Study Index');

  // reset globals
  study_index = [];
  var candidates = cards_index; 

  // sort and filter
  candidates = exclude_untoggled_decks(candidates);
  candidates = randomise_order(candidates);
  splice_and_push(10, candidates, study_index);

  // log messages in the console
  console.log('Study Index Complete: ', study_index);

}

function create_study_index_for_mastery() {
  
  // log messages in the console
  console.log('Building Study Index');

  // reset globals
  study_index = [];
  var candidates = cards_index; 

  // sort and filter
  candidates = exclude_untoggled_decks(candidates);
  candidates = sort_by_score_then_date(candidates);
  splice_and_push(10, candidates, study_index);
  study_index = randomise_order(study_index);

  // log messages in the console
  console.log('Study Index Complete: ', study_index);

}

function create_study_index_for_oldest() {
  
  // log messages in the console
  console.log('Building Study Index');

  // reset globals
  study_index = [];
  var candidates = cards_index; 

  // sort and filter
  candidates = exclude_untoggled_decks(candidates);
  candidates = sort_by_last_reviewed(candidates);
  splice_and_push(10, candidates, study_index);
  study_index = randomise_order(study_index);

  // log messages in the console
  console.log('Study Index Complete: ', study_index);

}

function create_study_index_for_default() {
  
  // log messages in the console
  console.log('Building Study Index');

  // reset globals
  study_index = [];
  var candidates = cards_index; 

  // sort and filter
  candidates = exclude_untoggled_decks(candidates);
  candidates = sort_by_score_then_date(candidates);

  var candidates_0 = candidates.filter(item => item.score === 0);
  var candidates_1 = candidates.filter(item => item.score === 1);
  var candidates_2 = candidates.filter(item => item.score === 2);
  var candidates_3 = candidates.filter(item => item.score === 3);
  var candidates_4 = candidates.filter(item => item.score === 4);
  var candidates_5 = candidates.filter(item => item.score === 5);
  
  splice_and_push(1, candidates_0, study_index);
  splice_and_push(1, candidates_1, study_index);
  splice_and_push(1, candidates_2, study_index);
  splice_and_push(1, candidates_3, study_index);
  splice_and_push(1, candidates_4, study_index);
  splice_and_push(5, candidates_5, study_index);

  // rebuild candidates from minis (now missing spliced items)
  candidates = [...candidates_1, ...candidates_2, ...candidates_3, ...candidates_4];

  // Calculate how many items short of 10 it is
  var difference = 10 - study_index.length;

  candidates = sort_by_score_then_date(candidates);
  splice_and_push(difference, candidates, study_index);

  // rebuild candidates from minis (now missing spliced items)
  candidates = [...candidates, ...candidates_0, ...candidates_5];

  // Calculate how many items short of 10 it is
  var difference = 10 - study_index.length;

  candidates = sort_by_score_then_date(candidates);
  splice_and_push(difference, candidates, study_index);

  study_index = randomise_order(study_index);

  // log messages in the console
  console.log('Study Index Complete: ', study_index);

}

// ---------------------------------------------------------
// HELPERS: STUDY INDEX 
// ---------------------------------------------------------

function sort_by_score(array) {

  // log messages in the console
  console.log('Sorting By Score...');

  // return result
  return [...array].sort((item_a, item_b) => item_a['score'] - item_b['score']);

}

function sort_by_last_reviewed(array) {

  // log messages in the console
  console.log('Sorting By Last Reviewed...');

  // return result
  return [...array].sort((item_a, item_b) => item_a['last_reviewed'] - item_b['last_reviewed']);

}

function sort_by_score_then_date(array) {

  // log messages in the console
  console.log('Sorting By Score & Last Reviewed...');

  // return result
  return [...array].sort((a, b) => {
  if (a.score !== b.score) {return a.score - b.score;}
    return new Date(a.last_reviewed) - new Date(b.last_reviewed);
  });

}

function exclude_untoggled_decks(array) {

  // log messages in the console
  console.log('Excluding Untoggled Decks...');

  // reference decks
  var decks_to_exclude = decks_index;

  // filter and map ids to exclude
  decks_to_exclude = decks_to_exclude.filter(deck => deck.toggled === false)
  decks_to_exclude = decks_to_exclude.map(deck => deck.unique_id);

  // return result
  return array.filter(item => !decks_to_exclude.includes(item.deck));

}

function splice_and_push(item_number, from_array, to_array) {
  
  // log messages in the console
  console.log('Splicing and Pushing Items...');

  // Remove items from the from_array
  var temp_items = from_array.splice(0, item_number);
  
  // Push them to the to_array
  to_array.push(...temp_items);
  
  // return the to_array (now with new items)
  return to_array;

}

function randomise_order(array) {

  // log messages in the console
  console.log('Randomising Card Order...');

  // return result
  return [...array].sort(() => Math.random() - 0.5);

}

// ---------------------------------------------------------
// SEARCH
// ---------------------------------------------------------

document.addEventListener('click', function(event) {

  // find the clicked control
  var target = event.target.closest('[data-action]'); if (!target) return;

  // perform the relavent task
  if (target.dataset.action === 'action_clear_search') {action_clear_search();}
  
});

document.getElementById('searchbar').addEventListener('input', function() {

  task_populate_results(this.textContent.trim());
  var list_ref = document.getElementById('dynamic_list_results');
  var results_total = list_ref.querySelectorAll('.card_snippet_wrapper').length;
  document.getElementById('results_indicator').textContent = results_total + ' results';

});

function action_clear_search() {
  console.log('Action: Clear Search');
  task_clear_search();
  document.getElementById('results_indicator').textContent = '0 results';
  searchbar.focus();
}

function task_render_search() {
  console.log('Rendering Search Scene...');
  var searchbar = document.getElementById('searchbar');
  var results = document.getElementById('dynamic_list_results');
  document.getElementById('results_indicator').textContent = '0 results';
  results.innerHTML = null;
  searchbar.textContent = '';
  searchbar.focus();
}

function task_populate_results(value) {

  // select the element to render inside
  var dynamic_list_results = document.getElementById('dynamic_list_results');
  
  // ensure the element has an innerhtml property
  dynamic_list_results.innerHTML = null;

  // specify array to loop through and perform actions
  cards_index.filter(item => ['question','answer'].some(key => item[key]?.toLowerCase().includes(value.toLowerCase()))).forEach(

    // specify the actions to perform on each list item
    function (list_item) {

      // insert html template
      dynamic_list_results.insertAdjacentHTML("beforeend", card_snippet);
        
      // grab the element just inserted
      var snippet = dynamic_list_results.lastElementChild;

      // fill its fields
      snippet.setAttribute('data-id', list_item.unique_id); // set id
      snippet.querySelector(".card_snippet_question").innerText = list_item.question; // set question
      snippet.querySelector(".card_snippet_answer").innerText = list_item.answer; // // set answer

      if (list_item.score === 0) {snippet.style.borderTop = "3px solid #54555D"}
      if (list_item.score === 1) {snippet.style.borderTop = "3px solid #C34A3F"}
      if (list_item.score === 2) {snippet.style.borderTop = "3px solid #EE8343"}
      if (list_item.score === 3) {snippet.style.borderTop = "3px solid #F6DA39"}
      if (list_item.score === 4) {snippet.style.borderTop = "3px solid #7FAC3A"}
      if (list_item.score === 5) {snippet.style.borderTop = "3px solid #43ACD9"}

    }
  );

}

function task_clear_search() {
  console.log('Clearing Search...');
  var searchbar = document.getElementById('searchbar');
  searchbar.textContent = ''; 
  var results = document.getElementById('dynamic_list_results');
  results.innerHTML = null;
}

// ---------------------------------------------------------
// TESTING
// ---------------------------------------------------------

// Listen for paste events anywhere on the page
// document.addEventListener('paste', (event) => {
      
//   // Get the plain text from the clipboard
//   var pasted_text = event.clipboardData.getData('text');

//   // guard agianst empty text
//   if (!pasted_text) {console.log('Nothing to paste.');return;}

//   // Split the pasted text by newlines to get each row
//   var rows = pasted_text.trim().split('\n');

//   var item_ref = realtime_database.ref('cards');

//   console.log('Detected paste event. Processing rows...');

//   // Go through each row
//   rows.forEach((row, index) => {
  
//     // Split by tab characters (common from spreadsheets)
//     var columns = row.split('\t');

//     var question_ref = columns[0] || '(no question)';
//     var answer_ref = columns[1] || '(no answer)';

//     // Perform a function for each row (for now, just log it)
//     console.log(`Row ${index + 1}:`);
//     console.log('Question: ' + question_ref);
//     console.log('Answer: ' + answer_ref);

//     item_ref.push({
//       deck: get_hash_id(),
//       question: question_ref,
//       answer: answer_ref,
//       score: 0,
//       last_reviewed: Date.now()
//     });
    
//   });
  
// });