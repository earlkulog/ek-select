'use strict';
if(!document.querySelector('style[ek-select-def-css]')){
	let css = `eksel-${Date.now()}-`;
	css = '-' + css;
	let style=document.createElement('style');
	style.setAttribute('ek-select-def-css','')
	let fn = a => {
		style.appendChild(document.createTextNode(a));
	}
	fn('ek-select,.eks-droplist{--itempaddingx:5px;--itempaddingy:3px;--bordercolor:#767676;--hilite:blue;--hilitetext:white;--selected:lightblue;--selectedtext:white;box-sizing:border-box;--bgcolor:white;--fgcolor:black}');
	fn('ek-select{display:inline-flex;flex-direction:row;align-items:center;border-style:solid;1px;border:1px solid var(--bordercolor);padding-right:0;background-color:var(--bgcolor);color:var(--fgcolor)}');
	fn('ek-select::after{margin-left:auto;height:100%;width:16px;font-family:materialicons;font-size:18px;font-weight:bold;display:flex;justify-content:center;align-items:center;content:"keyboard_arrow_down"}');
	fn('ek-select>input{width:calc(100% - 16px);border:none;outline:none}');
	fn('.eks-droplist{position:fixed;border: 1px solid var(--bordercolor);display:flex;flex-direction:column;overflow:auto;z-index:100;background-color:var(--bgcolor);color:var(--fgcolor);box-shadow: 0 5px 10px rgba(0,0,0,.7);}');
	fn('.eks-droplist>*{padding:var(--itempaddingy) var(--itempaddingx);cursor:default;white-space:nowrap;flex-shrink:0}');
	fn(`.eks-droplist>:hover{background-color:var(--hilite);color:var(--hilitetext)}`);
	fn('.eks-droplist>[selected]{background-color:var(--selected);color:var(--selectedtext)}');
	document.head.insertAdjacentElement('afterbegin',style);
}
class EkSelect extends HTMLElement {
	#input;
	#droplist;
	#selectedIndex;
	#form;
	#id;
	#usrpad;
	#maxItems;
	#internals;
	#items=[];
	#flags=0
	#initVal;
	#value;
	static #counter=0;

	constructor() {
		super();
		this.#internals=this.attachInternals()
		this.#internals.ariaRole='combobox'
		this.#input=document.createElement('input')
		this.#setHandlers()
	}

	#dispatchEvent=(e,opt={})=>{
		const t=typeof e,ev='string'==t?new Event(e, opt):new e.constructor(e.type,e),on=this['on'+ev.type];
		let ret=this.dispatchEvent(ev);
		if (ret===false||ev.defaultPrevented) {
			if ('string' != t)
				e.preventDefault();
			return false;
		}
		return ret;
	}
	#updateValidity=()=>{
		if (this.required)
			this.#internals.setValidity({valueMissing:!this.value}, 'Select item from the list or type in new value');
		else
			this.#internals.setValidity({valueMissing:false});
	}
	#setFormValue=a=>{
		this.#value=a||null
		this.#internals?.setFormValue(a||null)
	}
	get #ignorechange(){return this.#flags&2}
	set #ignorechange(a){
		if(a)
			this.#flags|=2
		else
			this.#flags&=~2
	}
	#updateFormValue=()=>{
		let a=this.#initVal||(this.selectedIndex==-1?(this.#input?.value||null)
			:this.#items[this.selectedIndex].value)
		if(a==this.#value)return
		this.#setFormValue(a)
		this.#dispatchChange()
		this.#updateValidity();
	}
	#dispatchChange=()=>this.#dispatchEvent('change',{bubbles:true,cancelable:!0})
	#setHandlers=()=>{
		let dropped;
		const clickHandler=e=>{
			if(e.target==this.#droplist)return;
			if(e.button==0){
				let el=document.elementFromPoint(e.pageX,e.pageY);
				if(this.#droplist.contains(el)){
					this.#ignorechange=!0
					this.#input.value=el.textContent
					this.selectedIndex=el.listIndex
					setTimeout(()=>this.#input.focus(),0);
				}
			}
			close();
		},
		close=()=>{
			dropped=false;
			this.#droplist&&this.#droplist.remove();
			this.setAttribute('aria-expanded', 'false');
			window.removeEventListener('mousedown',clickHandler,true);
		},
		populateItems=(f='',nl)=>{
			let cur=this.selectedIndex,osel=this.#selectedIndex,nsel,count=0;
			if (nl||void 0!=f) {
				void 0==f||(f=f.toLowerCase())
				const items=(f?this.#items.map((a,b)=>({...a,index:b})).filter(a=>a.text.toLowerCase().indexOf(f)!=-1):this.#items).map((a,b)=>{
					const index=a.index??b,text=a.text,value=a.value,div=document.createElement('div')
					div.textContent=text
					div.setAttribute('value',value)
					div.setAttribute('role','option')
					div.listIndex=index
					if(!f){
						if(a.value==this.#initVal||index==cur) {
							div.setAttribute('selected','')
							nsel=index
						}
					}
					else if(text.toLowerCase()==f) {
						div.setAttribute('selected','')
						nsel=index
					}
					return div
				})
				this.#droplist.replaceChildren(...items)
				count=items.length
			}
			if(!f)
				this.#setSelectedIndex(-1)
			else if(nsel!=osel||f){
				this.#selectedIndex=this.#items.length
				this.#setSelectedIndex(nsel||-1)
			}
			this.#initVal=void 0;
			return count
		},
		drop=f=>{
			const nolist=this.#droplist==null;
			this.setAttribute('aria-expanded', 'true');
			dropped=true;
			let div=this.#droplist;
			if (!div) {
				div=this.#droplist=document.createElement('div');
				div.setAttribute('role','listbox')
				div.classList.add('eks-droplist');
				div.id=this.#id;
				this.setAttribute('aria-controls', this.#id);
			}

			let indlg=false,owner=document.querySelector('dialog:modal')
			indlg=owner&&owner.contains(this)
			indlg||(owner=document.body)
			if(populateItems(f,nolist)>0&&!div.isConnected)
				owner.appendChild(div)

			let r=this.getBoundingClientRect(),css = {
				left: r.x,
				top: r.bottom,
				width: r.width,
			}

			if(indlg){
				r=owner.getBoundingClientRect()
				css.left-=r.x
				css.top-=r.y
			}

			for (let c in css) {
				div.style[c] = Math.round(css[c]) + 'px';
			}

			// div.style.font = getComputedStyle(this.#input).getPropertyValue('font');
			let cy=div.offsetHeight,max=Math.max(1, Math.min(this.maxItems, div.children.length)),sample;
			if (div.children.length == 0) {
				div.appendChild((sample=createContent('<div>&nbsp;</div>').firstChild))
			}
			cy = div.firstElementChild.offsetHeight * max;
			sample?.remove()
			if (div.scrollWidth > div.offsetWidth)
				cy += scrollbar.size;

			css.height = cy + 2;

			if (r.bottom + cy > window.innerHeight)
				css.top = r.top - cy;
			if (r.right > window.innerWidth)
				css.left = window.innerWidth - r.width;
			for (let c in css) {
				div.style[c] = css[c] + 'px';
			}
			window.addEventListener('mousedown',clickHandler,!0)
			this.#selectedIndex==-1||this.#droplist.children[this.#selectedIndex]?.scrollIntoView(!1)
		},
		handlers={
			pointerdown:e=>{
				e.preventDefault();
				setTimeout(()=>this.#input.focus(), 0);
				if(dropped) {
					close()
				}
				else if(e.x>=this.#input.getBoundingClientRect().right){
					drop();
				}
			},
			keydown:e=>{
				let handled=!0,cv=this.#input.value;
				try{
					if(e.ctrlKey||e.shiftKey||e.altKey){
						if(dropped){
							if(e.key=='Escape'){
								handled=3
								e.preventDefault()
							}
							close()
						}
						handled=handled==3
						return
					}
					if(!dropped) {
						if ((handled=e.key=='ArrowDown'))
							drop();
						return;
					}
					switch (e.key) {
						case 'Escape':
							if(document.activeElement!=this.#input)return
							e.preventDefault()
						case 'Enter':
							close();
							return;
					}
					let a=Array.from(this.#droplist.children),b=a.length,c=this.#droplist.querySelector('[selected]'),d=a.indexOf(c)+1;
					switch(e.key) {
						case 'ArrowDown':
							d=d%b+1;
							break;
						case 'ArrowUp':
							d=(d+(b-2))%b+1
							break;
						case 'Home':
							d=1;
							break;
						case 'End':
							d=b;
							break;
						default:
							handled=!1;
							return;
					}
					c&&c.removeAttribute('selected')
					c=a[--d]
					c.setAttribute('selected','')
					this.selectedIndex=a[d].listIndex
					this.#input.value=a[d].textContent
				}
				finally {
					if(handled){
						e.preventDefault();
						e.stopPropagation();
					}
				}
			},
			input:e=>{
				if(e.target!=this.#input){
					e.preventDefault()
					e.stopPropagation()
					return;
				}
				this.#initVal=void 0
				drop(this.#input.value);
				// if(this.#ignorechange){
				// 	this.#ignorechange=!1
				// 	return
				// }
				// this.#dispatchChange()
			},
			change:e=>e.target==this.#input&&e.preventDefault(),
			focusout:e=>e.target==this.#input&&close(),
			focus:e=>e.target!=this.#input&&this.#input.focus()
		}
		for(let h in handlers)
			this.addEventListener(h,handlers[h],!0);
	}
	static get observedAttributes() {
		return ['placeholder','style','max-items','maxlength','required','disabled']
	}
	static get formAssociated() {
		return true;
	}
	attributeChangedCallback(a,b,c) {
		switch(a){
			case 'placeholder':
			case 'maxlength':
			case 'disabled':
				if(b!=c){
					if(c!=null)
						this.#input.setAttribute(a,c)
					else
						this.#input.removeAttribute(a)
				}
				break;
			case 'style':
				this.#usrpad = parseFloat(this.style.paddingRight);
				if (isNaN(this.#usrpad))
					this.#usrpad=0;
				if(this.#droplist){
					let cs=getComputedStyle(this),st=this.#droplist.style
					for(let a of EkSelect.#cca){
						let b=cs.getPropertyValue(a)
						switch(a){
							case '--itempaddingx':
							case '--itempaddingy':
								if('number'==typeof b)
									b+='px'
								break
						}
						st.setProperty(a,b)
					}
				}
				break;
			case 'max-items':
				this.maxItems = c;
				break;
			case 'required':
				this.required=c!=null
				break;
		}
	}
	get disabled(){return this.#input.disabled}
	set disabled(v){this.#input.disabled=v}
	get items(){
		return this.#items
	}
	get form() {
		return this.#form;
	}
	get text(){
		return this.#input.value
	}
	set text(v) {
		if (v==this.text)
			return;
		this.#input.value=v
		this.#setSelectionByText();
	}
	get name() {
		return this.getAttribute('name');
	}
	set name(v){
		this.setAttribute('name',v);
	}
	get type(){return 'text'}
	get required(){return this.#flags&1==1}
	set required(v){
		if(v)
			this.#flags|=1
		else
			this.#flags&=~1
		this.#updateValidity()
	}
	get maxItems() {
		return this.#maxItems || 10;
	}
	set maxItems(v) {
		v = parseInt(v);
		if (isNaN(v))
			throw 'Invalid type for maxItems';
		this.#maxItems = v;
	}
	connectedCallback(){
		this.#updateFormValue(!0)
		this.setAttribute('role','combobox');
		this.setAttribute('aria-expanded','false');
		this.setAttribute('aria-haspopup','listbox');
		this.#form=this.#internals.form
		this.required=this.getAttribute('required')!=null
		this.#updateValidity()
		if (this.#id)return
		// this.#init=!0
		// if (this.#id==void 0)this.#id=`ek-select-id${++EkSelect.#counter}`
		this.#id=`ek-select-id${++EkSelect.#counter}`
		this.#usrpad=parseFloat(this.style.paddingRight)
		if (isNaN(this.#usrpad))
			this.#usrpad = 0;
		this.setAttribute('tabindex', '0');
		this.#rsch();
	}
	disconnectedCallback() {
		this.#droplist && this.#droplist.remove();
		this.#droplist = undefined;
	}
	formResetCallback() {
		this.#selectedIndex = undefined;
		this.#input.value = '';
		this.#updateValidity();
	}
	formStateRestoreCallback(state, reason) {
		this.#input.value = state;
	}
	#rsch=e=>{
		if (document.readyState=='complete') {
			if (undefined != e)
				document.removeEventListener('readystatechange', this.#rsch);
			this.#input.onchange=e=>{
				e.stopPropagation()
				e.preventDefault()
			}
			let ml=this.getAttribute('maxlength');
			if(ml)
				this.#input.setAttribute('maxlength',ml);
			if(this.getAttribute('disabled')!=null)
				this.#input.disabled=true;
			this.#input.setAttribute('autocomplete','off');
			if (this.#input.value)
				this.#setSelectionByText();
			this.#parseChildren();
			this.appendChild(this.#input);
			this.#input.onfocus=()=>this.#input.select();
			this.#input.id=`${this.#id}-input`;
			if(this.#form)
				this.#updateFormValue(!0)
			return;
		}
		document.addEventListener('readystatechange', this.#rsch);
	}
	#setSelectionByText=()=>{
		if(!this.#items)
			return;
		let i=this.#items.findIndex(a=>a.text==this.#input.value);
		if (i==-1)
			return;
		this.selectedIndex = i;
		this.#updateFormValue();
	}
	#parseChildren=()=>{
		const els = Array.from(this.children).filter(e => e instanceof HTMLElement);
		let i = 0;
		this.#items.length = 0;

		for (let n of els) {
			n.remove();
			if (this.#selectedIndex==void 0||n.getAttribute('selected') != null) {
				this.#selectedIndex = i;
				this.#input.value = n.textContent;
			}
			i++;
			const val = n.getAttribute('value') || n.textContent;
			this.#items.push({ text: n.textContent, value: val });
		}
	}
	#addItemToList=(i,o)=>{
		if (this.#droplist == undefined)
			return;
		const a = document.createElement('div');
		a.textContent = o.text;
		if (i==-1) {
			this.#droplist.appendChild(a);
			i = this.#droplist.children.length;
		}
		else {
			this.#droplist.insertBefore(a, this.#droplist.children[i]);
		}
		if (this.#input.value==o.text)
			this.selectedIndex=i;
		else
			this.selectedIndex=-1;
	}
	get children(){return[]}
	querySelectorAll(){return[]}
	querySelector(){return null}
	addItem=(text,value,data)=>{
		const o={text:text,value:value||text,data:data},r=this.#items.length;
		this.#items.push(o);
		this.#addItemToList(-1,o);
		if(this.#initVal&&value==this.#initVal)
			this.#input.value=text
		return r;
	}
	insertItem=(i,text,value,data)=>{
		const o = { text: text, value: value || text, data: data };
		this.#items.splice(i, 0, o);
		this.#addItemToList(i, o);
	}
	find=f=>this.#items.find(f)
	findIndex=f=>this.#items.findIndex(f)
	clearItems=()=>{
		this.#items.length=0;
		this.#droplist=void 0;
		this.#selectedIndex=void 0
		this.reset();
	}
	reset=()=>{
		this.#input.value='';
		this.selectedIndex=-1;
		this.#setFormValue()
	}
	get text(){
		return this.#input ? this.#input.value : '';
	}
	get value(){
		return this.#value
	}
	set value(v){
		this.#input.value=v
		if(!this.#droplist){
			this.#initVal=v
		}
		else{
			if(v)
				this.selectedIndex=this.#items.findIndex(a=>a.value==v)
			else{
				this.#selectedIndex=-1;
				this.#input.value=null;
			}
		}
		let f=this.#items.find(a=>a.value===v)
		f&&(this.#input.value=f.text)
		this.#updateFormValue()
	}
	get placeholder(){
		return this.#input.getAttribute('placeholder');
	}
	set placeholder(v) {
		this.#input.setAttribute('placeholder',v);
	}
	get itemCount() {
		return this.#droplist ? this.#droplist.children.length : this.#items.length;
	}
	get selectedIndex() {
		return this.#selectedIndex==void 0?-1:this.#selectedIndex
	}
	#setSelectedIndex=(v,x)=>{
		if('number'!=typeof v){
			v = parseInt(v);
			if (isNaN(v))
				throw 'Invalid value for selectedIndex';
		}
		if(v<-1||v>=this.#items.length)
			throw new RangeError('Index out of range')
		let a=this.selectedIndex
		if (v==a)
			return;
		this.#selectedIndex=v;
		if(x){
			this.#input.value=v==-1?null:this.#items[v].text
		}
		this.#updateFormValue();
	}
	set selectedIndex(v) {
		this.#setSelectedIndex(v,!0)
	}
	static #cca=['--itempaddingx','--itempaddingy','--bordercolor','--hilite','--hilitetext','--selected','--selectedtext','--bgcolor','--fgcolor']
}
window.customElements.define('ek-select', EkSelect);
'undefined'!=typeof addCxe&&addCxe('select')