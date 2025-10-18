// reusable HTML snippet
var deck_snippet = `

<a class="deck_snippet_wrapper" href="#/decks/deck_name/unique_id">
  <div class="deck_snippet_name">$deck_name</div>
  <div class="deck_snippet_count_wrapper">
    <div class="deck_snippet_count_icon"><i class="ph-fill ph-notebook"></i></div>
    <div class="deck_snippet_count_value">$$$</div>
  </div>
</a>

`;

// reusable HTML snippet
var card_snippet = `

<div class="card_snippet_wrapper">
  <div class="card_snippet_question" data-placeholder="Question..." contenteditable="true"></div>
  <div class="card_snippet_answer" data-placeholder="Answer..." contenteditable="true"></div>
<div>

`;