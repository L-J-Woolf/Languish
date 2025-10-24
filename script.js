// ---------------------------------------------------------
// GLOBALS 
// ---------------------------------------------------------

var decks_index = [];
var cards_index = [];
var study_index = [];
var synced_timestamp = 'last sync unknown';
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
  
  console.log("initialising app");
  await index_database();
  await route();
  install_realtime_listener();
  console.log("initialisation complete");

}

// listener for changes to the hash in the URL
window.addEventListener('hashchange', on_hash_change);

// function to handle hash changes
function on_hash_change() {
  console.log("Hash changed! URL: " + window.location.hash);
  route();
}

// ---------------------------------------------------------
// START-UP FUNCTIONS 
// ---------------------------------------------------------

// manually sync the local database with the realtime database
async function index_database() {
  
  // log messages in the console
  console.log("indexing database...");

  // get a live reference to the realtime database
  var snapshot = await realtime_database.ref('/').once('value');
  
  // store the snapshot  
  var db = snapshot.val();
  var decks_data = db?.decks || {};
  var cards_data = db?.cards || {};

  // build decks array (array_label: realtime_db_key)
  decks_index = Object.entries(decks_data).map(([realtime_id, realtime_object]) => ({
    unique_id: realtime_id,
    deck_name: realtime_object.name,
    order: realtime_object.order,
    toggled: realtime_object.toggled
  }));

  // build decks array (array_label: realtime_db_key)
  cards_index = Object.entries(cards_data).map(([realtime_id, realtime_object]) => ({
    unique_id: realtime_id,
    deck: realtime_object.deck,
    question: realtime_object.question,
    answer: realtime_object.answer,
    score: realtime_object.score,
    last_reviewed: realtime_object.last_reviewed
  }));

  // update global synced timestamp
  synced_timestamp = get_timestamp();

  // log messages in the console
  console.log('database synced & indexed: ' + synced_timestamp);
}

// route

async function route() {

  var current_hash = window.location.hash;
  var current_hash_id = get_unique_id_from_hash()

  if (!current_hash || current_hash === "#" || current_hash === "#/") {
    // No hash? set default
    location.hash = "#/dashboard";
    return; // stop here, route() will run again automatically when hash changes
  }

  if (current_hash.includes('#/dashboard')) { 
  console.log('hash includes #/dashboard');
  render_dashboard();
  load_scene('#/dashboard');
  }

  else if (current_hash.includes('#/decks/')) { 
  console.log('hash includes #/decks/');
  render_deck_scene(current_hash_id);
  load_scene('#/decks');
  }

  else if (current_hash.includes('#/study')) { 
  console.log('hash includes #/study');
  render_study_scene(current_hash_id);
  load_scene('#/study');
  }

  else { 
  console.log('no hash rule detected, default scene loading');
  render_dashboard();
  load_scene('#/dashboard');
  }
}

function install_realtime_listener() {
  
  // log messages in the console
  console.log("installing realtime listener");
  
  // connect listener to database
  realtime_database.ref("/").on("value", (snapshot) => {
  const data = snapshot.val();
  
  // first run, do not refresh
  if (is_first_load === true) {is_first_load = false;}
  
  // subsequent runs
  else {refresh();}
  });
}

// fucntion to refresh user interface
async function refresh() {
  console.log("database updated...");
  await index_database();
  await route();
}

// ---------------------------------------------------------
// LISTENERS 
// ---------------------------------------------------------

// listen for events on a practice button
document.getElementById('btn_practice_all').addEventListener("click", function() {
  console.log("Practing All"); 
  build_study_index_all();
  location.hash = '#/study/0/' + study_index[0].unique_id;
});

// listen for events on the toggle all button
// document.getElementById('btn_toggle_all').addEventListener("click", function() {
//   console.log("Toggling All"); 
//   toggle_all();
// });

// function to toggle all deck checkboxes (on or off)
// function toggle_all() {
  
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

//   // log messages in the console
//   console.log(checked_items ? 'All unchecked' : 'All checked');
// }

// listen for events on a practice button
document.getElementById('btn_practice_deck').addEventListener("click", function() {
  build_study_index_deck();
  location.hash = '#/study/0/' + study_index[0].unique_id;
});

// listen for click events on deck items
document.getElementById('dynamic_list_decks').addEventListener('click', function(event) {
  
  // Find the clicked control, even if an icon or span inside the button was clicked
  var target = event.target.closest('[data-action]');

  // guard agianst null clicks
  if (!target) return;

  var clicked_item = event.target.closest('.deck_snippet_wrapper'); // find the parent container of the clicked item
  var unique_id = clicked_item.dataset.id; // store the unique id of the parent container
  var action = target.dataset.action; // determine the correct action

  if (action === "toggle_deck") {toggle_deck(unique_id, target)}

});

// function for toggling decks on and off
function toggle_deck(unique_id, target) {
  console.log('deck toggled: ' + target.checked + ' (' + unique_id + ')');
  edit_deck_toggled_status(unique_id, target.checked);
}

// listener for adding decks
document.getElementById('btn_add_deck').addEventListener("click", function() {
  add_deck_to_database();
});

document.getElementById('btn_delete_deck').addEventListener("click", function() {
  delete_deck(get_unique_id_from_hash())
});

// listen for events on an element and execute code
document.getElementById('btn_add_card').addEventListener("click", function() {
  add_card_to_database();
});

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
    edit_deck_in_database(element_to_modify.textContent, get_unique_id_from_hash());
    element_to_modify.removeEventListener('blur', on_blur);
  }

});

// listen for click events on card items
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
  if (action === "delete_card") {delete_card(unique_id)}

});

// listen for click events on cards questions
function edit_question(unique_id, target) {
  
  // log messages in the console
  console.log("Question was clicked: " + unique_id);
  
  // set styles
  target.style.background = '#54555D';
  
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
  target.style.background = "#54555D";
  
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
  //Set the hash
  location.hash = '#/study/card/' + unique_id;
}

// listen for clicks on the delete card button
function delete_card(unique_id) {
  console.log('delete card: ' + unique_id);
  delete_card_from_database(unique_id);
}

// listen for events on an element and execute code
document.getElementById('btn_reveal').addEventListener("click", function() {
  console.log("revealing card");
  document.getElementById('btn_reveal').style.display = "none";
  document.getElementById('btn_rate').style.display = "flex";
  document.getElementById('studycard_answer').style.display = "flex";
  document.getElementById('studycard_instructions').textContent = "How well did you know this?";
  
  var hash_id = get_unique_id_from_hash();
  var card = cards_index.find(item => item.unique_id === hash_id);
  speakGerman(card.answer);
});

// listen for events on an element and execute code
document.getElementById('btn_rate').addEventListener('click', function(event) {

  document.getElementById('btn_reveal').style.display = "block";
  document.getElementById('btn_rate').style.display = "none";
  document.getElementById('studycard_answer').style.display = "none";
  document.getElementById('studycard_instructions').textContent = "Reveal answer";

  // Find the clicked control, even if an icon or span inside the button was clicked
  var target = event.target.closest('[data-action]');
  
  // guard agianst null clicks
  if (!target) return;
  
  // determine the correct action
  var action = target.dataset.action;
  var score = 0;

  if (action === "rate_card_1") {
    console.log("Card Rated: Red");
    score = 1; play_fail();
  }

  if (action === "rate_card_2") {
    console.log("Card Rated: Orange");
    score = 2; play_success();
  }

  if (action === "rate_card_3") {
    console.log("Card Rated: Yellow");
    score = 3; play_success();
  }

  if (action === "rate_card_4") {
    console.log("Card Rated: Green");
    score = 4; play_success();

  }

  if (action === "rate_card_5") {
    console.log("Card Rated: Blue");
    score = 5; play_success();
  }

  rate_and_interate(get_unique_id_from_hash(), score);

});

// function to rate and then iterate cards while studying
async function rate_and_interate(card_id, score) {
    await edit_card_score_in_database(card_id, score);
    await iterate_study_scene();
  }

// function to rate a card
async function rate_card(card_id, score) {
  edit_card_score_in_database(card_id, score);
}

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
    //location.hash = '#/study/0/' + study_index[0].unique_id;
  }

  else {location.hash = '#/study/' + next_iteration + '/' + study_index[next_iteration].unique_id;}
}

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

  document.getElementById('scene_sync_date').innerText = 'synced ' + synced_timestamp;

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
      snippet.querySelector(".deck_snippet_count").textContent = cards_index.filter(item => item.deck.includes(list_item.unique_id)).length + ' cards'; // set count
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
  document.getElementById('deck_title').innerText = find_deck_by_id(deck_id_to_render).deck_name;
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

  // reset scene
  // document.getElementById('btn_reveal').style.display = "block";
  // document.getElementById('btn_rate').style.display = "none";
  // document.getElementById('studycard_answer').style.display = "none";
  // document.getElementById('studycard_instructions').textContent = "Reveal answer";


  var title = document.getElementById('study_scene_title');
  var question = document.getElementById('studycard_question_content');
  var answer = document.getElementById('studycard_answer_content');
  var button_parent = document.getElementById('btn_reveal');
  var button_actual = button_parent.querySelector('.button_primary');
  var card = cards_index.find(item => item.unique_id === card_id_to_render);
  var card_wrap = document.querySelector('.studycard_snippet');

  title.textContent = card.score;
  question.textContent = card.question;
  answer.textContent = card.answer;

  if (card.score === 0) {button_actual.style.backgroundColor = "#54555D"}
  if (card.score === 1) {button_actual.style.backgroundColor = "#C34A3F"}
  if (card.score === 2) {button_actual.style.backgroundColor = "#EE8343"}
  if (card.score === 3) {button_actual.style.backgroundColor = "#F6DA39"}
  if (card.score === 4) {button_actual.style.backgroundColor = "#7FAC3A"}
  if (card.score === 5) {button_actual.style.backgroundColor = "#43ACD9"}

  if (card.score === 0) {card_wrap.style.boxShadow = "inset 0 2px 0 #54555D"}
  if (card.score === 1) {card_wrap.style.boxShadow = "inset 0 2px 0 #C34A3F"}
  if (card.score === 2) {card_wrap.style.boxShadow = "inset 0 2px 0 #EE8343"}
  if (card.score === 3) {card_wrap.style.boxShadow = "inset 0 2px 0 #F6DA39"}
  if (card.score === 4) {card_wrap.style.boxShadow = "inset 0 2px 0 #7FAC3A"}
  if (card.score === 5) {card_wrap.style.boxShadow = "inset 0 2px 0 #43ACD9"}

}

// ---------------------------------------------------------
// DATABASE FUNCTIONS 
// ---------------------------------------------------------

// function to add an item into the database
function add_deck_to_database() {
  
  // get a reference to the database
  var item_ref = realtime_database.ref('decks');

  // fun code to generate a ramdom default name for the deck
  var deck_name = generate_default_deck_name();

  // push a new item (firebase will give it a unique ID)
  item_ref.push({
    name: deck_name,
    order: 999,
    toggled: true
  });

  // show messages in the console
  console.log('new deck added:', deck_name);
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
    deck: get_unique_id_from_hash(),
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

// ---------------------------------------------------------
// HELPERS
// ---------------------------------------------------------

function debug() {
  console.log('debugging');

  function play_success() {const audio = new Audio('sounds/right.mp3');audio.play();}

  function play_fail() {const audio = new Audio('sounds/wrong.mp3');audio.play();}

  play_success();
  play_fail();

  // updates a card { rt_key: value , rt_key: value }
  //update_card_test('-OcIjLX4qzgsXSyFBMEv', { question: "after" , answer: "nach" });

  // console.log(decks_index);
  // build_study_index();
  // study_index = [
  //   {unique_id: "-ObgNX3PmqnJrjZKp1bH",question: "the cat"},
  //   {unique_id: "-ObgWRcMUVjcAjy3X4gP",question: "the bread"},
  //   {unique_id: "-Obgap9qLk_YmOSk4LrY",question: "the dog"},
  //   {unique_id: "-ObgapP7zMyfLPgYSXDA",question: "hot"},
  //   {unique_id: "-ObgoJsdVTYlbeSZLwoL",question: "to run"}
  // ];

  // console.log(study_index);

  // location.hash = '#/study/0/' + study_index[0].unique_id;

}

// function to update a card in the database
function update_card_test(unique_id, fields_to_update) {
  
  // get a reference to the card in the database
  var item_ref = realtime_database.ref('cards/' + unique_id);
  
  // update any and all feilds
  item_ref.update(fields_to_update);

  // log messages in the console
  console.log(`card ${unique_id} updated:`, fields_to_update);
}

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

// Function to fetch the current timestamp
function get_timestamp() {
  
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

// fucntion to update the synced timestamp
function update_synced_timestamp() {

  // locate html element by id, and store it a varible
  var scene_sync_date = document.getElementById('scene_sync_date');
  
  // update the specified element
  scene_sync_date.innerHTML = 'synced ' + timestamp();

  // log messages in the console
  console.log("sync timestamp updated");
}

// function to to speak aloud a string in german
function speakGerman(text_to_speak) {
  speechSynthesis.cancel();
  var utterance = new SpeechSynthesisUtterance(text_to_speak);
  utterance.lang = "de-DE";
  utterance.rate = 1.0;    // default is 1, range is 0.1 to 10
  speechSynthesis.speak(utterance);
}

function generate_default_deck_name() {
  var strings = [
    "strawberries aren't berries",
    "Sharks existed before trees",
    "Honey never spoils",
    "Octopuses have three hearts",
    "Wombat poo is cube-shaped",
    "Space smells like burnt steak",
    "Penguins propose with pebbles",
    "Bananas are berries",
    "Tomatoes are fruits",
    "Koalas have fingerprints",
    "Cows have best friends",
    "Crows remember human faces",
    "Goldfish have 3 month memory",
    "Otters hold hands while sleeping",
    "Pineapples take 2 years to grow",
    "Jellyfish are 95% water",
    "Turtles breathe with their butts",
    "Sharks have lived 400m years",
    "Pigeons can do maths",
    "Ants never sleep",
    "Cats can't taste sweetness",
    "Cucumbers are 95% water",
    "Snails can sleep for 3 years",
    "The moon causes tides",
    "Heart can beat outside body",
    "Elephants mourn their dead",
    "Giraffes have 7 neck bones",
    "Sharks have no bones",
    "Apples float in water",
    "Carrots were once purple",
    "Bees can recognise faces",
    "Oysters can change gender",
    "Banana plants are herbs",
    "Camels have three eyelids",
    "Sloths can hold their breath",
    "Dolphins have individual names",
    "Polar bears have black skin",
    "Flamingos aren't born pink",
    "Starfish have no brains",
    "Zebras can't be domesticated",
    "Avocados are toxic to birds",
    "Lobsters don't age biologically",
    "Goats have rectangular pupils",
    "Platypuses glow under blacklight",
    "Hippos secrete pink sunscreen",
    "Slugs have four noses",
    "Rabbits can't vomit",
    "Venus is hotter than Mercury",
    "Glass is actually a liquid",
    "Grapes explode in microwaves",
    "Saturn would float in water",
    "Your nose never stops growing",
    "Humans share 50% DNA with bananas",
    "An owl's head rotates 270 degrees"
  ];
  
  const randomIndex = Math.floor(Math.random() * strings.length);
  return strings[randomIndex];
}

function find_deck_by_id(id_of_deck_to_find) {
  return decks_index.find(item => item.unique_id === id_of_deck_to_find);
}

function find_card_by_id(id_of_card_to_find) {
  return cards_index.find(item => item.unique_id === id_of_card_to_find);
}

function find_decks_by_keyword(keyword_to_look_for) {
  return decks_index.filter(item => item.deck_name.includes(keyword_to_look_for));
}

function find_cards_by_keyword(keyword_to_look_for) {
  return cards_index.filter(item => item.question.includes(keyword_to_look_for));
}

function find_cards_by_deck_id(deck_id_to_look_for) {
  return cards_index.filter(item => item.deck.includes(deck_id_to_look_for));
}

function get_unique_id_from_hash() {
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
// STUDY INDEX FUNCTIONS 
// ---------------------------------------------------------

// function to render cards list
function build_study_index_all() {

  // show messages in the console
  console.log('Building Study Index: All');

  // Filter decks that are toggled ON
  var toggled_decks = decks_index.filter(function(item_ref) {
    return item_ref.toggled === true;
  });

  console.log('Toggled Decks: ' , toggled_decks);

  // Extract a list of toggled deck IDs
  var toggled_ids = toggled_decks.map(function(item_ref) {
    return item_ref.unique_id;
  });

  console.log('Toggled Ids: ' , toggled_ids);

  // Filter cards that belong to any toggled deck
  var candidates = cards_index.filter(function(item_ref) {
    // Check if this card's "decks" value matches one of the toggled deck IDs
    return toggled_ids.includes(item_ref.deck);
  });

  // Sort the cards by score (lowest first), then by last_reviewed (oldest first)
  candidates.sort(function(item_ref_a, item_ref_b) {
    if (item_ref_a.score !== item_ref_b.score) {
      return item_ref_a.score - item_ref_b.score; // sort by score first
    }

    // if scores are equal, sort by date
    var dateA = new Date(item_ref_a.last_reviewed);
    var dateB = new Date(item_ref_b.last_reviewed);
    return dateA - dateB; // earlier date first
  });

  // set study index
  study_index = candidates;

  // log study candidates
  console.log('Study Index: ', study_index);

}

// function to render cards list
function build_study_index_deck() {

  // show messages in the console
  console.log('Building Study Index: Deck');

  var deck_id = get_unique_id_from_hash();

  // Filter cards that belong to any toggled deck
  var candidates = cards_index.filter(function(item_ref) {
    // Check if this card's "decks" value matches one of the toggled deck IDs
    return deck_id.includes(item_ref.deck);
  });

  // Sort the cards by score (lowest first), then by last_reviewed (oldest first)
  candidates.sort(function(item_ref_a, item_ref_b) {
    if (item_ref_a.score !== item_ref_b.score) {
      return item_ref_a.score - item_ref_b.score; // sort by score first
    }

    // if scores are equal, sort by date
    var dateA = new Date(item_ref_a.last_reviewed);
    var dateB = new Date(item_ref_b.last_reviewed);
    return dateA - dateB; // earlier date first
  });

  // set study index
  study_index = candidates;

  // log study candidates
  console.log('Study Index: ', study_index);

}

function play_success() {const audio = new Audio('sounds/right.mp3');audio.play();}

function play_fail() {const audio = new Audio('sounds/wrong.mp3');audio.play();}