// reusable HTML snippet
var deck_snippet = `

<div class="deck_snippet_wrapper" data-id="$unique_id" draggable="true">
  <label class="deck_snippet_toggle_wrapper">
    <input data-action="toggle_deck" type="checkbox" checked="checked">
    <span class="deck_snippet_custom_checkbox_off"><i class="ph-fill ph-circle"></i></span>
    <span class="deck_snippet_custom_checkbox_on"><i class="ph-fill ph-check-circle"></i></span>
  </label>
  <a class="deck_snippet_button_wrapper" href="#/decks/deck_name/unique_id">
    <div class="deck_snippet_textcontent">
      <div class="deck_snippet_name">$deck_name</div>
      <div class="deck_snippet_count">$card_count</div>
    </div>
    <div class="deck_snippet_icon_wrapper">
      <div class="deck_snippet_icon"><i class="ph-bold ph-caret-right"></i></div>
    </div>
  </a>
</div>

`;

// reusable HTML snippet
var card_snippet = `

<div class="card_snippet_wrapper" data-id="$unique_id">
  <div class="card_snippet_header">
    <div class="card_snippet_label">Card</div>
    <div class="dropdown_wrapper">  
            <div class="dropdown_button" tabindex="0"><i class="ph-bold ph-dots-three"></i></div>
            <div class="dropdown_menu">
                <a tabindex="0" class="dropdown_item">Study</a>
                <a tabindex="0" class="dropdown_item">Edit</a>
                <a tabindex="0" class="dropdown_item" data-action="delete_card">Delete</a>
            </div>
        </div>
  </div>
  <div class="card_snippet_question" data-action="edit_question" data-placeholder="Question..." contenteditable="true"></div>
  <div class="card_snippet_answer" data-action="edit_answer" data-placeholder="Answer..." contenteditable="true"></div>
</div>

`;