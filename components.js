// reusable HTML snippet
var deck_card = `

<div class="deck_card">
  <div class="deck_card_type">$type</div>
  <div class="deck_card_right_column">
      <div class="deck_card_count">$count</div>
      <div class="deck_card_icon"><i class="ph-bold ph-caret-right"></i></div>
  </div>
</div>

`;

// reusable HTML snippet
var word_card = `

<div class="word_card">
  <div class="english">$english</div>
  <div class="german">$german</div>
  <div class="type">$type</div>
  <div class="score">$score</div>
</div>

`;

// reusable HTML snippet
`
  .multiline_input_outer {
    display: flex;
    align-items: center;         /* vertical centring */
    justify-content: center;     /* horizontal centring */
    height: 300px;
    width: 520px;
    border: 2px solid #333;
    padding: 12px;
    box-sizing: border-box;
    overflow: auto;              /* scroll once content is taller than the box */
    background: #fff;
  }

  .multiline_input_outer:focus-within {
    background: red;
  }

  .multiline_input_inner {
    /* Behaves like a textarea */
    outline: none;
    border: 0;
    width: 100%;                 /* constrain to the container width */
    max-width: 100%;
    min-width: 0;

    /* Centre the lines horizontally */
    text-align: center;

    /* Make wrapping behave nicely */
    white-space: pre-wrap;       /* preserve newlines and wrap long ones */
    overflow-wrap: anywhere;     /* wrap very long words or URLs */
    word-break: break-word;      /* legacy support */
    hyphens: auto;               /* allow hyphenation where supported */

    /* Typography */
    font: 16px/1.5 system-ui, sans-serif;
  }

  /* Placeholder for contenteditable */
  .multiline_input_inner:empty::before {
    content: attr(data-placeholder);
    color: #9aa0a6;
    pointer-events: none;
  }

<div class="multiline_input_outer">
  <div class="multiline_input_inner" contenteditable="true" data-placeholder="Start typing here..."</div>
</div>
`