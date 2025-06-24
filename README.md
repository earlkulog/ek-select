# ek-select

A lightweight, form-associated custom element that behaves like an editable `<select>` input. Built without Shadow DOM for full CSS control and seamless integration — including inside `<dialog>` elements and fixed-position UIs.

---

## ✨ Features

- Editable input with filter-as-you-type dropdown
- Fully keyboard-navigable (Arrow keys, Enter, Escape)
- Mouse support and click-to-select
- Works inside modals (`<dialog>`) and fixed-position containers
- Customizable via CSS variables
- Form-compatible: supports `name`, `value`, `required`, and resets
- No Shadow DOM — styles integrate globally

---

## ⚠️ Important Notes

- This component **does not** parse or render inner HTML.  
  Items must be added programmatically via JavaScript using `addItem(text, value, data)`.  
- `insertItem()` is not yet implemented — but can be added if needed.

---

## 📦 Installation

Include the script:
```html
<script src="ek-select.js"></script>

---

## Usage

<ek-select name="fruit" placeholder="Choose a fruit"></ek-select>

<script>
  const select = document.querySelector('ek-select');
  select.addItem('Apple', 'apple');
  select.addItem('Banana', 'banana');
  select.addItem('Cherry', 'cherry');
</script>

---

## 🧠 API

Methods:
- addItem(text, value, data)
  Adds a new item to the dropdown.
  text is shown to the user.
  value is submitted with the form.
  data (optional) is any extra data you want to associate.

- clearItems()
  Removes all items from the dropdown.

Properties
- value
  Read/write.
  Can be any native JavaScript type, not just a string.
- text
  The current input value.
- selectedIndex
  Gets/sets the selected item index (-1 if none selected).
- items
  Array of all items.
- maxItems
  Maximum number of items to display in the dropdown (default: 10).
- required
  Boolean indicating whether selection is required.
- disabled
Boolean indicating whether the input is disabled.

---

## 🎨 Styling
Override these global CSS variables to customize appearance:

ek-select {
  --itempaddingx: 5px;
  --itempaddingy: 3px;
  --bordercolor: #767676;
  --hilite: blue;
  --hilitetext: white;
  --selected: lightblue;
  --selectedtext: white;
  --bgcolor: white;
  --fgcolor: black;
}
