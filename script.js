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
    // map array labels to realtime database keys
  }));

  // build decks array (array_label: realtime_db_key)
  cards_index = Object.entries(cards_data).map(([realtime_id, realtime_object]) => ({
    unique_id: realtime_id,
    deck: realtime_object.deck,
    question: realtime_object.question,
    answer: realtime_object.answer,
    score: realtime_object.score,
    last_reviewed: realtime_object.last_reviewed
    // map array labels to realtime database keys
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
  render_study_list();
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
  console.log("data base updated...");
  await index_database();
  await route();
}

// ---------------------------------------------------------
// LISTENERS 
// ---------------------------------------------------------

// listener for adding decks
document.getElementById('btn_add_deck').addEventListener("click", function() {
  add_deck_to_database();
  console.log('button pressed: add deck');
});

document.getElementById('btn_delete_deck').addEventListener("click", function() {
  delete_deck(get_unique_id_from_hash())
  console.log('button pressed: delete deck');
});

// listen for events on an element and execute code
document.getElementById('btn_add_card').addEventListener("click", function() {
  add_card_to_database();
  console.log('button pressed: add card');
});

// listen for events on an element and execute code
document.getElementById('btn_practice_all').addEventListener("click", function() {
  console.log('button pressed: practice all');
});

// listener to enable or disable developer mode
document.getElementById('btn_toggle_developer_mode').addEventListener("dblclick", function() {
  // code to execute if the conditions are met
  if (is_developer_mode === false) { 
  var developer_options = document.getElementsByClassName("is_admin_only");
  for (let i = 0; i < developer_options.length; i++) {developer_options[i].style.display = "inline-block";}
  console.log("developer mode enabled");    
  is_developer_mode = true;

  // code to execute if the conditions are not met
  } else if (is_developer_mode === true) { 
  var developer_options = document.getElementsByClassName("is_admin_only");
  for (let i = 0; i < developer_options.length; i++) {developer_options[i].style.display = "none";}
  console.log("developer mode disabled");  
  is_developer_mode = false;
  } 
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


document.getElementById('dynamic_list_cards').addEventListener('click', function(event) {
  
  // check if the click was on (or inside) an element with class "a"
  if (event.target.closest('.button_secondary_ghost')) {
    console.log('clicked element A');
    return;
  }

  // check if the click was on (or inside) an element with class "b"
  if (event.target.closest('.card_snippet_question')) {
    console.log('clicked element B');
    return;
  }

  // check if the click was on (or inside) an element with class "c"
  if (event.target.closest('.card_snippet_answer')) {
    console.log('clicked element C');
    return;
  }

});

// // listener to pushes changes to cards to realtime database
// document.getElementById('dynamic_list_cards').addEventListener('focusout', event => {
  
//   // find the clicked item within the wrapper
//   var clicked_item = event.target.closest('.card_snippet_wrapper');
  
//   // store the relavent elements so we can access their values
//   var question_to_modify = clicked_item.querySelector('.card_snippet_question');
//   var answer_to_modify = clicked_item.querySelector('.card_snippet_answer');
//   var card_unique_id = clicked_item.dataset.id;

//   // pass details to the update function
//   edit_card_in_database(question_to_modify.innerText, answer_to_modify.innerText, card_unique_id )
// });

// });

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

  // specify array to loop through and perform actions
  decks_index.forEach (
      
    // specify the actions to perform on each list item
    function (list_item) {

      // insert html template
      dynamic_list_decks.insertAdjacentHTML("beforeend", deck_snippet);
        
      // grab the element just inserted
      var snippet = dynamic_list_decks.lastElementChild;

      // fill its fields
      snippet.querySelector(".deck_snippet_button_wrapper").href = '#/decks/' + list_item.deck_name + '/' + list_item.unique_id; // set hash
      snippet.setAttribute('data-id', list_item.unique_id); // set id
      snippet.querySelector(".deck_snippet_name").textContent = list_item.deck_name; // set deck name
      snippet.querySelector(".deck_snippet_count").textContent = cards_index.filter(item => item.deck.includes(list_item.unique_id)).length + ' cards'; // set count
    }
  );
}

// function to render cards list
function render_deck_scene(deck_id_to_render) {

  // show messages in the console
  console.log('rendering cards list for: ' + deck_id_to_render);

  // render page details
  document.getElementById('deck_title').innerText = find_deck_by_id(deck_id_to_render).deck_name;

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
        snippet.querySelector(".button_secondary_ghost").setAttribute('data-id', list_item.unique_id); // set id
        snippet.querySelector(".card_snippet_question").innerText = list_item.question; // set question
        snippet.querySelector(".card_snippet_answer").innerText = list_item.answer; // // set question
      }
    );
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
    name: deck_name
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

// function to delete a deck from the Realtime Database by its unique ID
function delete_deck(item_to_delete) {

  //build a reference to the specific card you want to delete
  var deck_ref = realtime_database.ref('decks/' + item_to_delete);

  // remove it from the database
  deck_ref.remove();
  
  var cards_to_delete = cards_index.filter(item => item.deck.includes(item_to_delete));

  cards_to_delete.forEach(function(item) {
    delete_card(item.unique_id)
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

// function to delete a card from the Realtime Database by its unique ID
function delete_card(item_to_delete) {

  //build a reference to the specific card you want to delete
  var card_ref = realtime_database.ref('cards/' + item_to_delete);

  // remove it from the database
  card_ref.remove();

}

// ---------------------------------------------------------
// HELPERS
// ---------------------------------------------------------

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
    "strawberries are not berries",
    "Sharks existed before trees",
    "Sloths hold breath longer than dolphins",
    "Honey never spoils",
    "Octopuses have three hearts",
    "Wombat poo is cube-shaped",
    "Space smells like burnt steak",
    "Penguins propose with pebbles",
    "A day on Venus is longer than a year",
    "The Eiffel Tower grows in summer",
    "Bananas are berries",
    "Tomatoes are fruits",
    "Koalas have fingerprints",
    "Sharks don't get bone cancer",
    "Butterflies taste with their feet",
    "Cows have best friends",
    "Ostriches run faster than horses",
    "A group of flamingos is flamboyance",
    "Crows remember human faces",
    "Goldfish have 3 month memory",
    "Sea otters hold hands to sleep",
    "Stomach gets new lining weekly",
    "Pineapples take 2 years to grow",
    "More stars than sand grains",
    "Jellyfish are 95% water",
    "Turtles breathe through their butts",
    "Sharks have lived 400m years",
    "Pigeons can do maths",
    "Ants never sleep",
    "Blue whale tongue weighs a car",
    "Cats can’t taste sweetness",
    "Earth’s core is hot as the sun",
    "Butterflies remember caterpillars",
    "Cucumbers are 95% water",
    "Snails can sleep for 3 years",
    "The moon causes tides",
    "Heart can beat outside body",
    "Elephants mourn their dead",
    "Giraffes have 7 neck bones",
    "Sharks have no bones",
    "Apples float in water",
    "The dot on an i is a tittle",
    "Carrots were once purple",
    "Bees can recognise faces",
    "Oysters can change gender",
    "Clouds can weigh millions",
    "Some turtles live for 150 years",
    "Banana plants are herbs",
    "An owls head rotates 270 degrees"
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