// ---------------------------------------------------------
// GLOBALS 
// ---------------------------------------------------------

// specify globals
var local_database_decks = [];
var local_database_cards = [];
var developer_mode = false;
var deck_first_load = true;
var card_first_load = true;
var active_deck_id = null;
// var assembled_deck = null;

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
document.addEventListener('DOMContentLoaded', async function initialise_app() {
  
  // log messages in the console
  console.log("initialising app (v3.2)");
  
  // startup functions which must fire and complete first
  await manually_sync_decks();
  await manually_sync_cards();
  await update_user_interface();
  await select_initial_scene();
  
  // startup functions which may fire concurrently
  install_popstate_handler();
  activate_realtime_decks_listener();
  activate_realtime_cards_listener();
  
  // log messages in the console
  console.log("initialisation complete");
});

// ---------------------------------------------------------
// START-UP FUNCTIONS 
// ---------------------------------------------------------

// STEP 1. manually sync the local database with the realtime database
async function manually_sync_cards() {
  
  // log messages in the console
  console.log("manually syncing database");

  // go to the 'words' section of the database and listen for *any* changes (add, edit, delete)
  return realtime_database.ref('cards').once('value').then(function(snapshot) {
    
    // get all entries stored under 'words'
    var data = snapshot.val();
    
    // turn the data into an array
    local_database_cards = data ? Object.entries(data).map(([id, item]) => ({ id, ...item })) : [];
   
    // log messages in the console
    console.log('database synced (manual) ' + timestamp() + ', total words: ' + local_database_cards.length);
  }); 
}

// STEP 1. manually sync the local database with the realtime database
async function manually_sync_decks() {
  
  // log messages in the console
  console.log("manually syncing database");

  // go to the 'words' section of the database and listen for *any* changes (add, edit, delete)
  return realtime_database.ref('decks').once('value').then(function(snapshot) {
    
    // get all entries stored under 'words'
    var data = snapshot.val();
    
    // turn the data into an array
    local_database_decks = data ? Object.entries(data).map(([id, item]) => ({ id, ...item })) : [];
   
    // log messages in the console
    console.log('decks synced (manual) ' + timestamp() + ', total decks: ' + local_database_decks.length);
  }); 
}

// STEP 2. build and update user-interface elements (utilises local database)
async function update_user_interface() {
  
  // log messages in the console
  console.log("updating user interface");
  
  // functions to build or update user-interface elements
  // query_unique_entries(local_database_cards, 'deck');
  render_decks_list();
  render_cards_list(local_database_cards);
  update_synced_timestamp();
}

// STEP 3. load the correct scene
async function select_initial_scene() {
  
  // log messages in the console
  console.log("selecting initial scene");

  // 1) prefer the hash in the URL if it points to a real scene element
  var hash = location.hash.slice(1);
  var initial_scene = (hash && document.getElementById(hash)) ? hash : null;

  // 2) otherwise try the last scene saved during the previous session
  if (!initial_scene) {
    try {
      var prev = sessionStorage.getItem('last_scene');
      if (prev && document.getElementById(prev)) {
        initial_scene = prev;
      }
    } catch (e) {
      // ignore storage errors and fall through to default
    }
  }

  // 3) fall back to your default scene
  if (!initial_scene) {
    initial_scene = 'scene_dashboard'; // specify default scene
  }

  // render without pushing a new history entry on first paint
  loadScene(initial_scene, { push: false });
}

// STEP 4. Install a single popstate handler once for back and forward navigation
async function install_popstate_handler() {
  
  // log messages in the console
  console.log("installing state handler");
  
  window.addEventListener("popstate", function (event) {
    var id = (event.state && event.state.scene) || location.hash.slice(1);
    // Render without pushing a new history entry
    if (id) loadScene(id, { push: false });
  });
}

// STEP 5. activate realtime listener for ongoing updates
async function activate_realtime_decks_listener() {
  
  // log messages in the console
  console.log('activating realtime listener');

  // go to the 'words' section of the database and listen for *any* changes (add, edit, delete)
  realtime_database.ref('decks').on('value', function(snapshot) {
    
    // get all entries stored under 'words'
    var data = snapshot.val();
    
    // turn the data into an array
    local_database_decks = data ? Object.entries(data).map(([id, item]) => ({ id, ...item })) : []; 
    
    // functions to run when the database is updated
     if (deck_first_load === false) {
      render_decks_list();
      render_cards_list(local_database_cards);
      update_synced_timestamp();
      console.log('database synced (realtime) ' + timestamp() + ', total decks: ' + local_database_decks.length);
    }
    
    // prevents functions from firing on first load
    else {
      deck_first_load = false;
    }

  });
}

async function activate_realtime_cards_listener() {
  
  // log messages in the console
  console.log('activating realtime listener');

  // go to the 'words' section of the database and listen for *any* changes (add, edit, delete)
  realtime_database.ref('cards').on('value', function(snapshot) {
    
    // get all entries stored under 'words'
    var data = snapshot.val();
    
    // turn the data into an array
    local_database_cards = data ? Object.entries(data).map(([id, item]) => ({ id, ...item })) : []; 
    
    // functions to run when the database is updated
     if (card_first_load === false) {
      render_decks_list();
      render_cards_list(local_database_cards);
      update_synced_timestamp();
      console.log('database synced (realtime) ' + timestamp() + ', total cards: ' + local_database_cards.length);
    }
    
    // prevents functions from firing on first load
    else {
      card_first_load = false;
    }

  });
}

// ---------------------------------------------------------
// LISTENERS 
// ---------------------------------------------------------

// listener to create listeners for all elements by class
document.querySelectorAll('.btn_back').forEach(item => {item.addEventListener("click", () => {
  window.history.back();
  });
});

// listener for adding decks
document.getElementById('btn_add_deck').addEventListener("click", function() {
  add_deck_to_database();
});

// listen for events on an element and execute code
document.getElementById('btn_add_card').addEventListener("click", function() {
  add_card_to_database();
});

// listen for events on an element and execute code
document.getElementById('btn_practice_all').addEventListener("click", function() {
  console.log('button pressed" practice all');
});

// listener to enable or disable developer mode
document.getElementById('btn_toggle_developer_mode').addEventListener("dblclick", function() {
  // code to execute if the conditions are met
  if (developer_mode === false) { 
  var developer_options = document.getElementsByClassName("is_admin_only");
  for (let i = 0; i < developer_options.length; i++) {developer_options[i].style.display = "inline-block";}
  console.log("developer mode enabled");    
  developer_mode = true;

  // code to execute if the conditions are not met
  } else if (developer_mode === true) { 
  var developer_options = document.getElementsByClassName("is_admin_only");
  for (let i = 0; i < developer_options.length; i++) {developer_options[i].style.display = "none";}
  console.log("developer mode disabled");  
  developer_mode = false;
  } 
});

// attach a delegated listener to a stable container element
document.getElementById('dynamic_list_decks').addEventListener('click', event => {
  
  // find the clicked item within the wrapper
  var clicked_item = event.target.closest('.deck_snippet_wrapper');
  
  // set the global deck id so decks are created with the right deck id
  active_deck_id = clicked_item.dataset.id;

  // assembled_deck = local_database_cards.filter(item => item['deck'] === clicked_item.dataset.id);
  
  // addition code to execute
  render_cards_list(local_database_cards);
  loadScene('scene_deck_list');

});

// attach a delegated listener to a stable container element
document.getElementById('dynamic_list_decks').addEventListener('dblclick', event => {
  
  // find the clicked item within the wrapper
  var clicked_item = event.target.closest('.deck_snippet_wrapper');

  // find the element within the clicked item you want to modify
  var element_to_modify = clicked_item.querySelector('.deck_snippet_name');

  //clicked_item.style.background = "red";
  element_to_modify.contentEditable = "true";
  element_to_modify.style.outline = 'none';
  element_to_modify.focus();

  element_to_modify.addEventListener('keydown', function (event) {
  if (event.key === 'Enter') {
    //event.preventDefault(); // stops a new line
    element_to_modify.blur();
    edit_deck_in_database(element_to_modify.innerText, clicked_item.dataset.id)
  }
  });

});

// attach a delegated listener to a stable container element.
document.getElementById('dynamic_list_cards').addEventListener('focusout', event => {
  
  // find the clicked item within the wrapper
  var clicked_item = event.target.closest('.card_snippet_wrapper');
  
  // store the relavent elements so we can access their values
  var question_to_modify = clicked_item.querySelector('.card_snippet_question');
  var answer_to_modify = clicked_item.querySelector('.card_snippet_answer');
  var card_unique_id = clicked_item.dataset.id;

  // pass details to the update function
  edit_card_in_database(question_to_modify.innerText, answer_to_modify.innerText, card_unique_id )
});

// ---------------------------------------------------------
// FUNCTIONS
// ---------------------------------------------------------

// Function to fetch the current timestamp
function timestamp() {
  
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

// function to render decks list
function render_decks_list() {
  
  // show messages in the console
  console.log('rendering decks list');

  // select the element to render inside
  var deck_list = document.getElementById('dynamic_list_decks');

  // ensure the element has an innerhtml property
  deck_list.innerHTML = null;

  // specify array to loop through and perform actions
  local_database_decks.forEach (
      
    // specify the actions to perform on each list item
      function (list_item) {

        // insert html template
        deck_list.insertAdjacentHTML("beforeend", deck_snippet);
        
        // grab the element just inserted
        var snippet = deck_list.lastElementChild;

        // fill its fields
        snippet.setAttribute('data-id', list_item.id); // set id
        snippet.querySelector(".deck_snippet_name").innerHTML = list_item.name;
        snippet.querySelector(".deck_snippet_count_value").innerHTML = "69";
      }
    );
}

// function to render cards list
function render_cards_list(cardset_to_render) {
  
  // show messages in the console
  console.log('rendering cards list');

  // select the element to render inside
  var cards_list = document.getElementById('dynamic_list_cards');
  
  // ensure the element has an innerhtml property
  cards_list.innerHTML = null;

  // specify array to loop through and perform actions
  cardset_to_render.forEach (
      
    // specify the actions to perform on each list item
      function (list_item) {

        // insert html template
        cards_list.insertAdjacentHTML("beforeend", card_snippet);
        
        // grab the element just inserted
        var snippet = cards_list.lastElementChild;

        // fill its fields
        snippet.setAttribute('data-id', list_item.id); // set id
        snippet.querySelector(".card_snippet_question").innerHTML = list_item.question;
        snippet.querySelector(".card_snippet_answer").innerHTML = list_item.answer;
      }
    );
}

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
  var item_ref = realtime_database.ref('decks/' + item_to_delete);

  // remove it from the database
  item_ref.remove();
}

// function to add an item into the database
function add_card_to_database() {
  
  // get a reference to the database
  var item_ref = realtime_database.ref('cards');

  // push a new item (firebase will give it a unique ID)
  item_ref.push({
    deck: active_deck_id,
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

// function which loads specified scene and hides all others
function loadScene(scene_to_load) {
  
  // Find the scene element
  var scene_element = document.getElementById(scene_to_load);

  // Hide all scenes
  var scenes = document.querySelectorAll(".scene");
  for (var i = 0; i < scenes.length; i++) {scenes[i].style.display = "none";}

  // Show the requested scene
  scene_element.style.display = "block";

  // Remember the last scene so refresh without a hash can restore it
  try { sessionStorage.setItem('last_scene', scene_to_load); } catch (e) {}

  // push history to browser
  if (location.hash.slice(1) !== scene_to_load) {
    history.pushState({ scene: scene_to_load }, "", "#" + scene_to_load);
  }

  // Log for debugging
  console.log('loading scene: ' + scene_to_load);
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