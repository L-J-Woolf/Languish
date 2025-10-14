// specify global varibles
var vocab_database = [];
var developer_mode = false;
var types_list = [];
var query_result = [];
var ready_to_start = false;
var has_started = false;

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


function is_refresh_in_this_tab() {
  // best effort: navigation API where available
  var nav = performance.getEntriesByType && performance.getEntriesByType('navigation');
  var type = nav && nav[0] ? nav[0].type : (performance.navigation && performance.navigation.type === 1 ? 'reload' : 'navigate');
  return type === 'reload';
}

function get_start_scene() {
  return (history.state && history.state.scene) || location.hash.slice(1) || 'scene_decks';
}



// ---------------------------------------------------------
// history wiring (run once)
// ---------------------------------------------------------

window.addEventListener('popstate', function (event) {
  var id = (event.state && event.state.scene) || location.hash.slice(1);
  if (id) loadScene(id);
});



// ---------------------------------------------------------
// function to parse realtime database into 'vocab_database' and sync in realtime
// ---------------------------------------------------------

// function to parse realtime database into 'vocab_database' and sync in realtime
function sync_realtime_database() {
  console.log('syncing realtime database');

  // listen for any changes under 'words'
  realtime_database.ref('words').on('value', function (snapshot) {
    var data = snapshot.val();
    vocab_database = data ? Object.entries(data).map(function ([id, item]) { return Object.assign({ id: id }, item); }) : [];

    ready_to_start = true;
    //var scene_sync_date = document.getElementById('scene_sync_date');
    //scene_sync_date.innerHTML = 'synced ' + timestamp();

    console.log('database synced ' + timestamp() + ', total words: ' + vocab_database.length);

    // update UI that depends on data, but do not force scenes here
    update_data_bound_ui();

    // if first time in this tab, run the one-off bootstrap
    if (!has_started) {
      startup_first_time();
      has_started = true;
      sessionStorage.setItem('app_started', '1');
    }
  });
}

// update UI widgets that depend on the data but should not change scenes
function update_data_bound_ui() {
  if (!ready_to_start) return;
  query_unique_entries(vocab_database, 'type');
  build_types_list();

  update_synced_timestamp();
}



// ---------------------------------------------------------
// first time startup logic (runs once per tab)
// ---------------------------------------------------------

function startup_first_time() {
  console.log('startup initialising');

  if (!ready_to_start) {
    // wait briefly until the first DB sync arrives
    setTimeout(startup_first_time, 500);
    console.log('startup pending');
    return;
  }

  // if this looks like a refresh, restore the previous scene
  // otherwise choose a default or respect any hash
  var start_id = is_refresh_in_this_tab() || sessionStorage.getItem('app_started')
    ? get_start_scene()
    : get_start_scene(); // both paths respect a hash if present

  // use replaceState so we do not add an extra entry on first paint
  try {
    history.replaceState({ scene: start_id }, '', '#' + start_id);
  } catch (_) {
    location.hash = start_id;
  }

  loadScene(start_id);
  console.log('startup complete');
}



// ---------------------------------------------------------
// your existing scene loader, unchanged in spirit
// expects a string id
// ---------------------------------------------------------

function loadScene(scene_to_load) {
  // push history
  try {
    history.pushState({ scene: scene_to_load }, '', '#' + scene_to_load);
  } catch (_) {
    location.hash = scene_to_load;
  }

  // hide all scenes
  var scenes_to_hide = document.querySelectorAll('.scene');
  for (var i = 0; i < scenes_to_hide.length; i++) {
    scenes_to_hide[i].style.display = 'none';
  }

  // show the requested scene
  var scene_el = document.getElementById(scene_to_load);
  if (scene_el) scene_el.style.display = 'block';

  console.log('loading scene: ' + scene_to_load);
}



// ---------------------------------------------------------
// app entry point
// ---------------------------------------------------------

window.addEventListener('DOMContentLoaded', function () {
  // mark whether this tab has started before
  if (!sessionStorage.getItem('app_started')) {
    // nothing to do yet, first DB sync will call startup_first_time
  } else {
    // returning session or a refresh, let DB sync update UI, then restore scene in startup_first_time
  }

  // start realtime sync
  sync_realtime_database();
});



// ---------------------------------------------------------
// LISTENERS 
// ---------------------------------------------------------

// listener to show and hide scenes
btn_add_item.addEventListener("click", function() {
  loadScene('scene_add_item');
});

// listener to show and hide scenes
btn_back.addEventListener("click", function() {
  loadScene('scene_decks');
});

// listener to enable or disable developer mode
btn_toggle_developer_mode.addEventListener("dblclick", function() {
  toggle_developer_mode();
});



// ---------------------------------------------------------
// FUNCTIONS
// ---------------------------------------------------------

// function to log a specified variable
function log_variable(variable_to_log) {
  console.log(variable_to_log);
}

// function to search an array for all unique values attributed to a specified key
function query_unique_entries(array_to_query, key_to_query) {
  
  //confirm the fucntion is running
  console.log('querying unique entries for "' + key_to_query + '"');

  // extracts all values attributed to (key_to_query) from each object in (array_to_query)
  var all_entries = array_to_query.map(item => item[key_to_query]);

  // stores the (all_entries) map as a set, which removes duplicates
  var unique_entries = [...new Set(all_entries)];

  // build a new array of objects with counts
  query_result = unique_entries.map(value => {
    return {
      type: value,
      count: all_entries.filter(entry => entry === value).length
    };
  });

  // logs a message in the console log
  console.log(query_result);
}

// function to search an array for all items with both the specefied key and value
function query_all_entries(array_to_query, key_to_query, value_to_query) {
  
  //confirm the fucntion is running
  console.log('querying all entries for "' + key_to_query + '" and "' + value_to_query + '"');

  // creates a new array with items filtered from the specified array (array_to_query) with the specefied key (key_to_query) and value (value_to_query)
  query_result = array_to_query.filter(item => item[key_to_query] === value_to_query);
  
  // logs a messagse in the console log
  console.log(query_result);
}

// function to add an item into the database
function add_database_item(english, german, score, type) {
  
  // get a reference to 'words' list in the database
  var word_ref = realtime_database.ref('words');

  // push a new item into 'words' (firebase will give it a unique ID)
  word_ref.push({
    english: english, // english word
    german: german,   // german word
    score: score,     // score
    type: type        // type
  });

  // show messages in the console
  console.log('new word added:', english, german);

}

// function to delete a word by its values
function delete_database_item(english, german, type) {
  
  // get a reference to 'words' list in the database
  var word_ref = realtime_database.ref('words');

  // look through each word entry
  word_ref.once('value', function(snapshot) {
    
    //loop through each word in 'words'
    snapshot.forEach(function(childSnapshot) {
      var word = childSnapshot.val();  // The word data
      var key = childSnapshot.key;     // The unique key (like -Nf8...)

      // Check if both english and german match
      if (word.english === english && word.german === german && word.type === type) {
        // If it matches, remove it
        realtime_database.ref('words/' + key).remove();
        console.log('word removed: ', english, german);
      }
    });
  })
}

// function to loop through an array
function build_list() {
  
  // specify array to loop through and perform actions
  vocab_database.forEach (
      
    // specify the actions to perform on each list item
      function (list_item) {

        // insert html template
        scene.insertAdjacentHTML("beforeend", word_card);
        
        // grab the element just inserted
        var card = scene.lastElementChild;

        // fill its fields
        card.querySelector(".type").innerHTML = list_item.type;
        card.querySelector(".english").innerHTML = list_item.english;
        card.querySelector(".german").innerHTML = list_item.german;
        card.querySelector(".score").innerHTML = list_item.score;
      }
    );
}

// function to loop through an array
function build_types_list() {
  
  var deck_list = document.getElementById('deck_list');
  deck_list.innerHTML = null;

  // specify array to loop through and perform actions
  query_result.forEach (
      
    // specify the actions to perform on each list item
      function (list_item) {

        var deck_list = document.getElementById('deck_list');

        // insert html template
        deck_list.insertAdjacentHTML("beforeend", deck_card);
        
        // grab the element just inserted
        var card = deck_list.lastElementChild;

        // fill its fields
        card.querySelector(".deck_card_type").innerHTML = list_item.type + "s";
        card.querySelector(".deck_card_count").innerHTML = list_item.count + " cards";
      }
    );
}

// function to read aloud specified text (text_to_speak)
function speakGerman(text_to_speak) {
  speechSynthesis.cancel();
  var utterance = new SpeechSynthesisUtterance(text_to_speak);
  utterance.lang = "de-DE";
  utterance.rate = 1.0;    // default is 1, range is 0.1 to 10
  speechSynthesis.speak(utterance);
}

// function to add an html snippet to a scene
function load_snippet (specify_scene, snippet_to_insert) {
  // insert html template
  specify_scene.insertAdjacentHTML("beforeend", snippet_to_insert);
}

// Function to fetch the current timestamp
function timestamp() {
  
  // log messages in the console
  console.log("fetching timestamp");
  
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

// function to retrieve values from inputs
function submit_user_input() {
  
  // locate input fields
  var deck_field = document.getElementById("deck_field");
  var english_field = document.getElementById("english_field");
  var german_field = document.getElementById("german_field");
  
  // store their values
  var deck_input = deck_field.value;
  var english_input = english_field.value;
  var german_input = german_field.value;
  
  // validate inputs
  if (deck_input === "" || english_input === "" || german_input === "") {
  console.log("please fill out all form fields");
  
  // code to execute if successful
  } else {
  console.log("submitting data");
  add_database_item(english_input, german_input, 1, deck_input)  
  } 
  
  // reset the fields afterwards
  deck_field.value = "";
  english_field.value = "";
  german_field.value = "";
}

// function to enable and disable developer mode
function toggle_developer_mode() {

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
}

// function which loads specified scene and hides all others
function loadScene(scene_to_load) {

  var scene_element = document.getElementById(scene_to_load);;
  // push history to browser
  history.pushState({scene: scene_to_load }, "", "#" + scene_to_load);

  // identify all ".scene" elements 
  var scenes_to_hide = document.querySelectorAll(".scene");

   // hide all ".scene" elements 
  for (var i = 0; i < scenes_to_hide.length; i++) {
    scenes_to_hide[i].style.display = "none";
  }

  // display the specified scene
  scene_element.style.display = "block";

  // logs a message in the console log
  console.log('loading scene: ' + scene_to_load);

  // handle back and forward
  window.addEventListener("popstate", function (event) {
    var id = (event.state && event.state.scene) || location.hash.slice(1);
    if (id) loadScene(id);
  });
}