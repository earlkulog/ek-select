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
	fn('.eks-droplist{overflow:auto;position:fixed;border: 1px solid var(--bordercolor);display:flex;flex-direction:column;overflow:auto;z-index:100;background-color:var(--bgcolor);color:var(--fgcolor);box-shadow: 0 5px 10px rgba(0,0,0,.7);}');
	fn('.eks-droplist>*{padding:var(--itempaddingy) var(--itempaddingx);cursor:default;white-space:nowrap;flex-shrink:0}');
	fn(`.eks-droplist>:hover{background-color:var(--hilite);color:var(--hilitetext)}`);
	fn('.eks-droplist>[selected]{background-color:var(--selected);color:var(--selectedtext)}');
	document.head.insertAdjacentElement('afterbegin',style);
}
class EkSelect extends HTMLElement {
	#input
	#droplist
	#selectedIndex
	#form
	#id
	#maxItems
	#internals
	#items=[]
	#flags=0
	#initVal
	#value
	#ownerState
	#cy1st
	#ignoreBlur

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
	get #owner(){
		if(!this.#ownerState) {
			let a=document.querySelector('dialog:modal')
			this.#ownerState=a&&a.contains(this)?a:!0
		}
		return this.#ownerState===!0?null:this.#ownerState
	}
	#dispatchChange=()=>this.#dispatchEvent('change',{bubbles:true,cancelable:!0})
	#setHandlers=()=>{
		let dropped;
		const clickHandler=e=>{
			if(e.target==this.#droplist){
				this.#ignoreBlur=!0
				const r=this.#droplist.getBoundingClientRect();
				if (scrollbar.calcCCY(this.#droplist)<r.height && e.y >= r.bottom - scrollbar.size)return;
				if (scrollbar.calcCCX(this.#droplist)<r.width && e.x >= r.right - scrollbar.size)return;
				this.#ignoreBlur=!1
				return
			}
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
			window.removeEventListener('mousedown',clickHandler,true)
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
			const nolist=this.#droplist===null||this.#droplist.children.length===0;
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

			populateItems(f,nolist)
			div.isConnected||(this.#owner||document.body).appendChild(div)

			if(!this.#cy1st) {
				let dummy
				if(div.children.length===0)
					div.appendChild(dummy=createContext('<div>&nbsp;</div>').firstChild)
				this.#cy1st=div.firstElementChild.offsetHeight
				dummy?.remove()
			}
			setDropdownPos()
			window.addEventListener('mousedown',clickHandler,!0)
			this.#selectedIndex==-1||this.#droplist.children[this.#selectedIndex]?.scrollIntoView(!1)
		},
		getXYOffset=()=>{
			let x,y
			if(this.#owner){
				let z=this.#owner.getBoundingClientRect()
				x=z.x
				y=z.y
			}
			return{x:x??0,y:y??0}
		},
		calcPos=(r,rp,css,cssp,wp)=>{
			let g1=Math.min(r[rp],css[cssp]),g2=window[wp]-css[cssp],dx=g1>g2?Math.max(0,r[rp]-g1):css[cssp],dy=Math.max(g1,g2)
			if(this.#owner) {
				r=this.#owner.getBoundingClientRect()
				dx-=r[rp]
			}
			return{dx:dx,dy:dy}
		},
		setDropdownPos=()=>{
			let r=this.getBoundingClientRect(),xy=getXYOffset(),css={
				left: r.x-xy.x,
				top: r.bottom-xy.y,
				width: r.width,
				height: this.#cy1st*Math.max(1,this.#droplist.children.length)+2
			}
			if(css.top+css.height>window.innerHeight) {
				let p=calcPos(r,'top',css,'height','innerHeight')
				css.top=p.dx
				css.height=p.dy
			}
			if(css.left+css.width>window.innerWidth) {
				let p=calcPos(r,'left',css,'width','innerWidth')
				css.left=p.dx
				css.width=p.dy
			}
			for (let c in css) {
				this.#droplist.style[c] = Math.round(css[c]) + 'px';
			}
		},
		handlers={
			pointerdown:e=>{
				e.preventDefault();
				setTimeout(()=>this.#input.focus(), 0);
				if(dropped){
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
				let f=this.#input.value.trim()
				if(!f)
					close()
				else
					drop(f)
			},
			change:e=>e.target==this.#input&&e.preventDefault(),
			focusout:e=>{
				if(this.#ignoreBlur)
					this.#ignoreBlur=!1
				else if(e.target==this.#input)
					close()
			},
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
		return [...this.#items]
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
		this.#id=`ek-select-id${Date.now()}`
		this.setAttribute('tabindex', '0');
		this.#rsch();
	}
	disconnectedCallback() {
		this.#droplist && this.#droplist.remove();
		this.#droplist = undefined;
		this.#ownerState=this.#cy1st=null
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
	#shiftListIndices=(a,b=1)=>{
		for(;a<this.#droplist.children.length;a++)
			this.#droplist.children[a].listIndex+=b
	}
	#findItemByLi=a=>{
		if(!this.#droplist)return -1
		const b=this.#droplist.children
		if(b.length==0) return -1
		if(b.length==this.#items.length) return a
		for(let c=0;c<b.length;c++) {
			if(b[c].listIndex==a)
				return c
		}
	}
	#addItemToList=(i,o)=>{
		if (this.#droplist==void 0)
			return;
		if(!this.#droplist.isConnected) {
			this.#droplist.replaceChildren()
			return
		}
		const a = document.createElement('div');
		a.textContent = o.text;
		if (i==-1) {
			this.#droplist.appendChild(a);
			i = this.#droplist.children.length;
			a.listIndex = this.#items.length-1
		}
		else {
			a.listIndex=i
			i=this.#findItemByLi(i)
			this.#shiftListIndices(i+1)
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
		if (i<0||i>this.#items.length)
		    throw new RangeError("Invalid index for insertItem");
		const o = { text: text, value: value || text, data: data };
		if(i==this.#items.length) {
			this.#items.push(o)
			this.#addItemToList(-1, o)
		}
		else{
			this.#items.splice(i, 0, o);
			this.#addItemToList(i, o)
		}
	}
	removeItem=a=>{
		if('number'!=typeof a) {
			a=parseInt(a)
		}
		if(isNaN)
			throw new TypeError('index')
		const b=this.#items.length
		if(a<0||a>=b)
			throw new RangeError('index')
		this.#items.splice(a,1)
		if(this.#droplist) {
			if(!this.#droplist.isConnected)
				this.#droplist.innerHTML=''
			else{
				a=this.#findItemByLi(a)
				this.#droplist[a].remove()
				this.#shiftListIndices(a+1,-1)
			}
		}
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
