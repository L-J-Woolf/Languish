// ---------------------------------------------------------
// GLOBALS 
// ---------------------------------------------------------

var settings_index = [];
var stats_index = [];
var decks_index = [];
var cards_index = [];
var study_index = [];
var is_first_load = true;
var is_developer_mode = false;

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
  is_all_toggled: settings_data.is_all_toggled,
  is_dark_mode: settings_data.is_dark_mode
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
  render_dashboard();
  load_scene('#/dashboard');
  }

  else if (current_hash.includes('#/decks/')) { 
  console.log('Hash includes #/decks/');
  render_deck_scene(current_hash_id);
  load_scene('#/decks');
  }

  else if (current_hash.includes('#/study')) { 
  console.log('Hash includes #/study');
  render_study_scene(current_hash_id);
  load_scene('#/study');
  }

  else { 
  console.log('No hash rule detected, loading default scene');
  render_dashboard();
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
  else {
    refresh();
  }
  });
}

// fucntion to refresh user interface
async function refresh() {
  console.log("Database updated...");
  await index_database();
  await route();
}

// ---------------------------------------------------------
// LISTENERS 2.0
// ---------------------------------------------------------

document.addEventListener('click', function(event) {

  // find the clicked control
  var target = event.target.closest('[data-action]'); if (!target) return;

  // perform the relavent task
  if (target.dataset.action === 'action_practice_all') {action_practice_all();}
  if (target.dataset.action === 'action_practice_deck') {action_practice_deck();}
  if (target.dataset.action === 'action_add_deck') {action_add_deck();}
  if (target.dataset.action === 'action_delete_deck') {action_delete_deck();}
  if (target.dataset.action === 'action_add_card') {action_add_card();}
  if (target.dataset.action === 'action_back') {action_back();}
  if (target.dataset.action === 'action_toggle_all') {action_toggle_all();}
  if (target.dataset.action === 'action_debug') {action_debug();}
  if (target.dataset.action === 'action_toggle_modes_on') {action_toggle_modes_on();}
  if (target.dataset.action === 'action_toggle_modes_off') {action_toggle_modes_off();}
  if (target.dataset.action === 'action_practice_random') {action_practice_random();}
  if (target.dataset.action === 'action_practice_mastery') {action_practice_mastery();}
  if (target.dataset.action === 'action_practice_oldest') {action_practice_oldest();}
  
});

document.getElementById('dynamic_list_decks').addEventListener('click', function(event) {
  
  // Find the clicked control
  var target = event.target.closest('[data-action]'); if (!target) return;

  var clicked_item = event.target.closest('.deck_snippet_wrapper'); // find the parent container of the clicked item
  var unique_id = clicked_item.dataset.id; // store the unique id of the parent container
  var action = target.dataset.action; // determine the correct action

  if (action === "action_toggle_deck") {action_toggle_deck(unique_id, target)}

});

document.getElementById('dynamic_list_cards').addEventListener('click', function(event) {
  
  // Find the clicked control, even if an icon or span inside the button was clicked
  var target = event.target.closest('[data-action]');

  // guard agianst null clicks
  if (!target) return;

  var clicked_item = event.target.closest('.card_snippet_wrapper'); // find the parent container of the clicked item
  var unique_id = clicked_item.dataset.id; // store the unique id of the parent container
  var action = target.dataset.action; // determine the correct action

  if (action === "edit_question") {edit_question(unique_id, target)}
  if (action === "edit_answer") {edit_answer(unique_id, target)}
  if (action === "study_card") {study_card(unique_id)}
  if (action === "action_delete_card") {action_delete_card(unique_id)}

});

// ---------------------------------------------------------
// ACTIONS 2.0
// ---------------------------------------------------------

function action_debug() {
  console.log('Debugging');
  //update_card_test('-OcAj8qdy7YTbJ-mguSI', { flipped: true, score: 2 });
  flip_card();
}

function action_practice_all() {
  console.log('Action: Practice All');
  create_study_index_for_all();
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

function action_add_deck() {
  console.log('Action: Add Deck');
  add_deck_to_database();
}

function action_delete_deck() {
  console.log('Action: Delete Deck');
  delete_deck(get_hash_id());
}

function action_add_card() {
  console.log('Action: Add Deck');
  add_card_to_database();
}

function action_delete_card(unique_id) {
  console.log('Action: Delete Card');
  delete_card_from_database(unique_id);
}

function action_back() {
  console.log('Action: Back');
  window.history.back();
}

// function for toggling decks on and off
function action_toggle_deck(unique_id, target) {
  console.log('deck toggled: ' + target.checked + ' (' + unique_id + ')');
  update_setting_test('is_all_toggled', false);
  edit_deck_toggled_status(unique_id, target.checked);
}

// function for toggling all decks on and off
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
// TASKS 2.0 
// ---------------------------------------------------------

// function to toggle dev mode on and off
function toggle_developer_mode() {
  if (is_developer_mode === false) {
    console.log("enabling developer mode");
    document.getElementById('developer_menu').style.display = "block";
    is_developer_mode = true;
  }
  else if (is_developer_mode === true) {
    console.log("disabling developer mode");
    document.getElementById('developer_menu').style.display = "none";
    is_developer_mode = false;
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
    update_setting_test('is_all_toggled', false);
    document.querySelector('#toggle_all input[type="checkbox"]').checked = false;
    console.log('All were checked → all unchecked');
  } 
  
  else if (someChecked) {
    // Some checked → check the rest
    toggles_ref.forEach(t => { if (!t.checked) t.click(); });
    update_setting_test('is_all_toggled', true);
    document.querySelector('#toggle_all input[type="checkbox"]').checked = true;
    console.log('Some were checked → now all checked');
  } 
  
  else if (noneChecked) {
    // None checked → check all
    toggles_ref.forEach(t => { if (!t.checked) t.click(); });
    update_setting_test('is_all_toggled', true);
    document.querySelector('#toggle_all input[type="checkbox"]').checked = true;
    console.log('None were checked → all checked');
  }
}

// function to toggle all deck checkboxes (on or off)
// function task_toggle_all() {
  
//   // collect all elements that contain a deck toggle input
//   var toggles_ref = Array.from(document.getElementsByClassName('deck_snippet_toggle_wrapper'));
  
//   // check whether *all* of the inputs are currently checked
//   var checked_items = toggles_ref.every(wrapper => {
//     var toggle_input  = wrapper.querySelector('input[type="checkbox"], input[type="radio"]');
//     return toggle_input  && toggle_input .checked;
//   });

//   // Loop through each wrapper and toggle accordingly
//   toggles_ref.forEach(function(wrapper) {
    
//     // Find the input element inside this wrapper
//     var toggle_input  = wrapper.querySelector('input[type="checkbox"], input[type="radio"]');
    
//     // Proceed only if an input element was found
//     if (toggle_input ) {
      
//       // If all were checked, click to uncheck them, If some were unchecked, click only those unchecked
//       if (checked_items || !toggle_input .checked) {toggle_input.click();}

//     }

//   });

//   // update_setting_test(is_all_toggled, true)

//   // log messages in the console
//   console.log(checked_items ? 'All unchecked' : 'All checked');
// }

// listen for click events on cards questions
function edit_question(unique_id, target) {
  
  // log messages in the console
  console.log("Question was clicked: " + unique_id);
  
  // set styles
  target.style.background = "rgba(255, 255, 255, 0.12)";
  
  // listen for offfocus
  target.addEventListener('blur', on_blur);
  
  // on de-focus
  function on_blur(event) {
    target.removeEventListener('blur', on_blur);
    target.style.removeProperty("background");
    edit_question_in_database(target.innerText, unique_id);
    console.log("Question was edited: " + target.innerText);
  }

}

// listen for click events on cards answers
function edit_answer(unique_id, target) {
  // log messages in the console
  console.log("Answer was clicked: " + unique_id);
  
  // set styles
  target.style.background = "rgba(255, 255, 255, 0.12)";
  
  // listen for offfocus
  target.addEventListener('blur', on_blur);
  
  // on de-focus
  function on_blur(event) {
    target.removeEventListener('blur', on_blur);
    target.style.removeProperty("background");
    edit_answer_in_database(target.innerText, unique_id);
    console.log("Answer was edited: " + target.innerText);
  }

}

// listen for clicks on the study card button
function study_card(unique_id) {
  console.log('studying card: ' + unique_id);
  create_study_index_for_card(unique_id);
  location.hash = '#/study/0/' + study_index[0].unique_id;
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
    // element_to_modify.style.background = "#38393E";
    element_to_modify.contentEditable = "false";
    edit_deck_in_database(element_to_modify.textContent, get_hash_id());
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

  update_card_test(card_ref[0].unique_id, { flipped: card_is_flipped, score: score, last_reviewed: Date.now() });
  iterate_study_scene();
  update_stats();

});

// function to rate and then iterate cards while studying
// async function rate_and_interate(card_id, score) {
//   // await edit_card_score_in_database(card_id, score);
//   await update_card_test(card_ref[0].unique_id, { flipped: card_status, score: score });
//   await update_stats();
//   await iterate_study_scene();
// }

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
function render_dashboard() {
  
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
      
      // console.log('Deck: ' , deck_index);
      // console.log('Total Cards: ' + total_cards);
      // console.log('Total Score: ' + total_score);
      // console.log('Mastery: ' + mastery);

      snippet.querySelector(".deck_snippet_count").textContent = total_cards + ' cards' + ' • ' + mastery + '%'; // set count

      //snippet.querySelector(".deck_snippet_count").textContent = cards_index.filter(item => item.deck.includes(list_item.unique_id)).length + ' cards'; // set count

      if (list_item.toggled === true) { snippet.querySelector('input[type="checkbox"]').checked = true;  }
      else if (list_item.toggled === false) { snippet.querySelector('input[type="checkbox"]').checked = false;  }
    }
  );
}

// function to render cards list
function render_deck_scene(deck_id_to_render) {

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

// function to update a card in the database
function update_card_test(unique_id, fields_to_update) {
  
  // get a reference to the card in the database
  var item_ref = realtime_database.ref('cards/' + unique_id);
  
  // update any and all feilds
  item_ref.update(fields_to_update);

  // log messages in the console
  console.log(`card ${unique_id} updated:`, fields_to_update);
}

// function to add an item into the database
function add_deck_to_database() {
  
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

// function to edit an item into the database
function edit_deck_in_database(deck_name, unique_id) {
  
  // point to the specific item using its id
  var item_ref = realtime_database.ref('decks/' + unique_id);

  // update only the provided fields
  item_ref.update({
    name: deck_name
  });

  console.log('deck updated:', deck_name, unique_id);
}

// function to edit an item into the database
function edit_deck_toggled_status(unique_id, toggle_status) {
  
  // point to the specific item using its id
  var item_ref = realtime_database.ref('decks/' + unique_id);

  // update only the provided fields
  item_ref.update({
    toggled: toggle_status
  });

  console.log('deck updated:', unique_id, toggle_status);
}

// function to edit an item into the database
function edit_deck_order_in_database(unique_id, order) {
  
  // point to the specific item using its id
  var item_ref = realtime_database.ref('decks/' + unique_id);

  // update only the provided fields
  item_ref.update({
    order: order
  });

  console.log('deck updated:', unique_id, order);
}

// function to delete a deck from the Realtime Database by its unique ID
function delete_deck(item_to_delete) {

  //build a reference to the specific card you want to delete
  var deck_ref = realtime_database.ref('decks/' + item_to_delete);

  // remove it from the database
  deck_ref.remove();
  
  var cards_to_delete = cards_index.filter(item => item.deck.includes(item_to_delete));

  cards_to_delete.forEach(function(item) {
    delete_card_from_database(item.unique_id)
  });

}

// function to add an item into the database
function add_card_to_database() {
  
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

// function to edit an item into the database
function edit_question_in_database(question, unique_id) {
  
  // point to the specific item using its id
  var item_ref = realtime_database.ref('cards/' + unique_id);

  // update only the provided fields
  item_ref.update({
    question: question
  });

  // show messages in the console
  console.log('card updated:', question, unique_id);
}

// function to edit an item into the database
function edit_answer_in_database(answer, unique_id) {
  
  // point to the specific item using its id
  var item_ref = realtime_database.ref('cards/' + unique_id);

  // update only the provided fields
  item_ref.update({
    answer: answer
  });

  // show messages in the console
  console.log('card updated:', answer, unique_id);
}

// function to edit an item into the database
function edit_card_in_database(question, answer, unique_id) {
  
  // point to the specific item using its id
  var item_ref = realtime_database.ref('cards/' + unique_id);

  // update only the provided fields
  item_ref.update({
    question: question,
    answer: answer
  });

  // show messages in the console
  console.log('card updated:', question, answer, unique_id);
}

// function to edit an item into the database
function edit_card_score_in_database(unique_id, score) {
  
  // point to the specific item using its id
  var item_ref = realtime_database.ref('cards/' + unique_id);

  // update only the provided fields
  item_ref.update({
    score: score,
    last_reviewed: Date.now()
  });

  // show messages in the console
  console.log('card updated:', unique_id, score);
}

// function to delete a card from the Realtime Database by its unique ID
function delete_card_from_database(item_to_delete) {

  //build a reference to the specific card you want to delete
  var card_ref = realtime_database.ref('cards/' + item_to_delete);

  // remove it from the database
  card_ref.remove();

}

// function to update a setting in the database
function update_setting_test(setting_to_update, new_value) {
  
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

	// log messages in the console
	// console.log('dragover');

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
    edit_deck_order_in_database(item.id, item.position);

	});
	
	// 5. Print the result to the console
	console.log('Order with positions:', orderWithPositions);

}

// ---------------------------------------------------------
// TASKS: STUDY INDEX 
// ---------------------------------------------------------

function create_study_index_for_all() {
  
  // log messages in the console
  console.log('Building Study Index');

  // reset globals
  study_index = [];
  var candidates = cards_index; 

  // sort and filter
  candidates = exclude_untoggled_decks(candidates);
  candidates = sort_by_score_then_date(candidates);
  splice_and_push(5, candidates, study_index);
  candidates = sort_by_last_reviewed(candidates);
  splice_and_push(5, candidates, study_index);
  study_index = randomise_order(study_index);

  // log messages in the console
  console.log('Study Index Complete: ', study_index);

}

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