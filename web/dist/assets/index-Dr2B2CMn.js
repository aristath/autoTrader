const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/dist-DC92rvyD.js","assets/dist-DVVEuDXO.js","assets/dist-Dqw31Kj4.js","assets/dist-CU9RSMqi.js","assets/dist-B7fCVZHN.js","assets/dist-D9gnJY7T.js","assets/dist-C3BRodzt.js","assets/dist-BBd3zPGs.js","assets/dist-CBOYBa2B.js","assets/dist-CLbigwyS.js","assets/dist-DigoV2kp.js"])))=>i.map(i=>d[i]);
(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=class extends HTMLElement{connectedCallback(){if(this.hasPendingTemplateBindings()){queueMicrotask(()=>{this.isConnected&&this.render()});return}this.render()}attributeChangedCallback(){this.isConnected&&this.render()}escape(e){return String(e).replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#39;`)}hasPendingTemplateBindings(){return[...this.attributes].some(e=>e.name.includes(`$lit$`)||e.value.includes(`lit$`))||this.innerHTML.includes(`lit$`)}render(){}},t={start:`flex-start`,center:`center`,end:`flex-end`,baseline:`baseline`,stretch:`stretch`},n={start:`flex-start`,center:`center`,end:`flex-end`,between:`space-between`,around:`space-around`,evenly:`space-evenly`},r=class extends e{static observedAttributes=[`direction`,`align`,`justify`,`wrap`];get direction(){return this.getAttribute(`direction`)===`column`?`column`:`row`}get align(){return t[this.getAttribute(`align`)]||`stretch`}get justify(){return n[this.getAttribute(`justify`)]||`flex-start`}get wrap(){return this.hasAttribute(`wrap`)?`wrap`:`nowrap`}render(){this.style.display=`flex`,this.style.flexDirection=this.direction,this.style.alignItems=this.align,this.style.justifyContent=this.justify,this.style.flexWrap=this.wrap}};customElements.define(`tui-flex`,r);var i=class extends e{static observedAttributes=[`height`];get height(){let e=Number(this.getAttribute(`height`));return Number.isInteger(e)&&e>0?e:1}render(){this.style.display=`block`,this.style.minHeight=`${this.height}lh`,this.style.color=`var(--tui-background)`,this.style.background=`var(--tui-color)`}};customElements.define(`tui-bar`,i);var a={single:{topLeft:`┌`,topRight:`┐`,bottomLeft:`└`,bottomRight:`┘`,horizontal:`─`,vertical:`│`},double:{topLeft:`╔`,topRight:`╗`,bottomLeft:`╚`,bottomRight:`╝`,horizontal:`═`,vertical:`║`}},o=class extends e{static observedAttributes=[`border`,`heading`];#e;#t;#n;#r;#i;#a;#o;#s;#c;#l;#u;#d;get border(){return this.getAttribute(`border`)===`double`?`double`:`single`}get heading(){return this.getAttribute(`heading`)||``}connectedCallback(){super.connectedCallback(),this.#f()}#f(){if(!this.#e||!this.#a){queueMicrotask(()=>{this.isConnected&&this.#f()});return}typeof ResizeObserver<`u`&&(this.#l?.disconnect(),this.#l=new ResizeObserver(()=>this.#g()),this.#l.observe(this.#e),this.#l.observe(this.#a)),this.#u?.disconnect(),this.#u=new MutationObserver(()=>this.#_()),this.#u.observe(this,{childList:!0}),queueMicrotask(()=>this.#g())}disconnectedCallback(){this.#l?.disconnect(),this.#u?.disconnect()}render(){this.#a||this.#p(),this.#m(),this.#v()}#p(){let e=[...this.childNodes];this.style.display=`block`,this.style.minWidth=`0`,this.style.overflowWrap=`anywhere`,this.innerHTML=`
			<div data-tui-box-top aria-hidden="true"></div>
			<div data-tui-box-body>
				<span data-tui-box-left aria-hidden="true"></span>
				<div data-tui-box-content></div>
				<span data-tui-box-right aria-hidden="true"></span>
			</div>
			<div data-tui-box-bottom aria-hidden="true"></div>
		`,this.#e=this.querySelector(`[data-tui-box-top]`),this.#r=this.querySelector(`[data-tui-box-body]`),this.#i=this.querySelector(`[data-tui-box-left]`),this.#a=this.querySelector(`[data-tui-box-content]`),this.#o=this.querySelector(`[data-tui-box-right]`),this.#s=this.querySelector(`[data-tui-box-bottom]`),this.#e.style.cssText=`display:flex;min-width:0;overflow:hidden;white-space:nowrap;contain:inline-size`,this.#r.style.cssText=`display:grid;grid-template-columns:2ch minmax(0,1fr) 2ch;align-items:stretch;min-width:0`,this.#i.style.cssText=`overflow:hidden;white-space:pre;line-height:inherit`,this.#a.style.cssText=`min-width:0;overflow-wrap:anywhere`,this.#o.style.cssText=`overflow:hidden;white-space:pre;line-height:inherit`,this.#s.style.cssText=`display:flex;min-width:0;overflow:hidden;white-space:nowrap;contain:inline-size`,this.#a.append(...e)}#m(){let e=a[this.border];this.#e.replaceChildren(),this.#t=this.#h(e.topLeft),this.#n=this.#h(e.horizontal,!0),this.#e.append(this.#t,this.#h(this.heading?e.horizontal:``),this.#h(this.heading?`\u00a0${this.heading}\u00a0`:``),this.#n,this.#h(e.topRight)),this.#s.replaceChildren(),this.#c=this.#h(e.horizontal,!0),this.#s.append(this.#h(e.bottomLeft),this.#c,this.#h(e.bottomRight)),this.#g()}#h(e,t=!1){let n=document.createElement(`span`);return n.textContent=e,n.style.display=`block`,n.style.whiteSpace=`nowrap`,t?(n.style.flex=`1 1 0`,n.style.minWidth=`0`,n.style.overflow=`hidden`):n.style.flex=`0 0 auto`,n}#g(){if(!this.#e||!this.#a)return;let e=this.#e.getBoundingClientRect(),t=this.#t.getBoundingClientRect().width,n=t>0?Math.max(1,Math.ceil(e.width/t)):1,r=a[this.border].horizontal.repeat(n);this.#n.textContent=r,this.#c.textContent=r;let i=e.height,o=this.#a.getBoundingClientRect().height,s=i>0?Math.max(1,Math.ceil(o/i-.01)):1,c=a[this.border].vertical;this.#i.textContent=Array.from({length:s},()=>`${c}\u00a0`).join(`
`),this.#o.textContent=Array.from({length:s},()=>`\u00a0${c}`).join(`
`)}#_(){let e=new Set([this.#e,this.#r,this.#s]),t=[...this.childNodes].filter(t=>!e.has(t));t.length>0&&this.#a.append(...t)}#v(){this.hasAttribute(`role`)||this.setAttribute(`role`,`group`);let e=this.getAttribute(`aria-label`);this.heading&&(!e||e===this.#d)?(this.setAttribute(`aria-label`,this.heading),this.#d=this.heading):!this.heading&&e===this.#d&&(this.removeAttribute(`aria-label`),this.#d=void 0)}};customElements.define(`tui-box`,o);var s=class extends e{state={active:!1,focus:!1,hover:!1};static observedAttributes=[`aria-controls`,`aria-expanded`,`aria-label`,`disabled`,`inverted`,`name`,`type`,`value`,`variant`];connectedCallback(){super.connectedCallback()}get type(){let e=this.getAttribute(`type`);return e===`submit`||e===`reset`?e:`button`}get variant(){let e=this.getAttribute(`variant`);return e===`success`||e===`warning`||e===`error`?e:`default`}get marker(){return this.variant===`success`?`+ `:this.variant===`warning`?`! `:this.variant===`error`?`x `:``}get variantColor(){return this.variant==="default"?`var(--tui-color)`:`var(--tui-${this.variant}-color)`}get stateActive(){return!this.hasAttribute(`disabled`)&&(this.state.hover||this.state.focus||this.state.active)}get inverted(){return this.hasAttribute(`inverted`)&&this.variant==="default"}get buttonStyle(){let e=this.hasAttribute(`disabled`)?`var(--tui-disabled-color)`:this.stateActive?this.inverted?`var(--tui-color)`:`var(--tui-focus-color)`:this.inverted?`var(--tui-background)`:this.variantColor,t=this.stateActive?this.inverted?`var(--tui-background)`:this.variant==="default"?`var(--tui-focus-background)`:this.variantColor:`var(--tui-background-transparent)`,n=this.hasAttribute(`disabled`)?`var(--tui-disabled-cursor)`:`var(--tui-action-cursor)`,r=this.stateActive&&this.state.active?`var(--tui-active-text-decoration)`:`var(--tui-text-decoration)`;return[`all:var(--tui-reset-all)`,`font-family:var(--tui-font-family)`,`color:${e}`,`background:${t}`,`text-decoration:${r}`,`cursor:${n}`,`outline:var(--tui-focus-outline)`].join(`;`)}setState(e,t){this.state[e]!==t&&(this.state[e]=t,this.updateButtonStyle())}updateButtonStyle(){this.buttonElement?.setAttribute(`style`,this.buttonStyle)}setButtonAttribute(e,t){t===null?this.buttonElement.removeAttribute(e):this.buttonElement.setAttribute(e,t)}bindButtonEvents(){this.buttonElement.addEventListener(`mouseenter`,()=>this.setState(`hover`,!0)),this.buttonElement.addEventListener(`mouseleave`,()=>{this.setState(`hover`,!1),this.setState(`active`,!1)}),this.buttonElement.addEventListener(`focus`,()=>this.setState(`focus`,!0)),this.buttonElement.addEventListener(`blur`,()=>{this.setState(`focus`,!1),this.setState(`active`,!1)}),this.buttonElement.addEventListener(`pointerdown`,()=>this.setState(`active`,!0)),this.buttonElement.addEventListener(`pointerup`,()=>this.setState(`active`,!1)),this.buttonElement.addEventListener(`pointercancel`,()=>this.setState(`active`,!1)),this.buttonElement.addEventListener(`keydown`,e=>{(e.key===` `||e.key===`Enter`)&&this.setState(`active`,!0)}),this.buttonElement.addEventListener(`keyup`,()=>this.setState(`active`,!1))}mount(){let e=[...this.childNodes];this.state.active=!1,this.state.focus=!1,this.state.hover=!1,this.innerHTML=`
			<button>
				<span aria-hidden="true">[</span><span data-tui-button-marker aria-hidden="true"></span><span data-tui-button-content></span><span aria-hidden="true">]</span>
			</button>
		`,this.buttonElement=this.querySelector(`button`),this.markerElement=this.querySelector(`[data-tui-button-marker]`),this.contentElement=this.querySelector(`[data-tui-button-content]`),this.contentElement.append(...e),this.bindButtonEvents()}updateButton(){this.buttonElement.type=this.type,this.buttonElement.disabled=this.hasAttribute(`disabled`),this.setButtonAttribute(`name`,this.getAttribute(`name`)),this.setButtonAttribute(`value`,this.getAttribute(`value`)),this.setButtonAttribute(`aria-controls`,this.getAttribute(`aria-controls`)),this.setButtonAttribute(`aria-expanded`,this.getAttribute(`aria-expanded`)),this.setButtonAttribute(`aria-label`,this.getAttribute(`aria-label`)),this.markerElement.textContent=this.marker,this.updateButtonStyle()}render(){this.buttonElement||this.mount(),this.updateButton()}};customElements.define(`tui-button`,s);var c=0,l=class extends e{static observedAttributes=[`aria-label`,`heading`,`open`];#e;#t;#n;#r;#i;#a=`tui-modal-heading-${++c}`;get open(){return this.hasAttribute(`open`)}set open(e){this.toggleAttribute(`open`,!!e)}get heading(){return this.getAttribute(`heading`)||``}get returnValue(){return this.#e?.returnValue||``}connectedCallback(){super.connectedCallback(),this.#i=new MutationObserver(()=>this.#u()),this.#i.observe(this,{childList:!0}),this.#l()}disconnectedCallback(){this.#i?.disconnect()}showModal(){this.setAttribute(`open`,``),this.#l()}close(e=``){this.#e?.open&&this.#e.close(e),this.removeAttribute(`open`),this.#e&&(this.#e.style.display=`none`)}render(){this.#e||this.#o(),this.#c(),this.#l()}#o(){let e=[...this.childNodes];this.innerHTML=`
			<dialog>
				<div data-tui-modal-layout>
					<div data-tui-modal-header>
						<span data-tui-modal-heading></span>
						<span data-tui-modal-close></span>
					</div>
					<div data-tui-modal-content></div>
				</div>
			</dialog>
		`,this.#e=this.querySelector(`dialog`),this.#t=this.querySelector(`[data-tui-modal-heading]`),this.#n=this.querySelector(`[data-tui-modal-content]`);let t=this.querySelector(`[data-tui-modal-close]`);this.#r=document.createElement(`tui-button`),this.#r.setAttribute(`aria-label`,`Close`),this.#r.textContent=`×`,t.append(this.#r),this.#e.style.cssText=[`all:var(--tui-reset-all)`,`position:fixed`,`inset:0`,`width:100vw`,`height:100dvh`,`max-width:100vw`,`max-height:100dvh`,`color:var(--tui-color)`,`background:var(--tui-background)`,`font-family:var(--tui-font-family)`,`overflow:hidden`].join(`;`),this.querySelector(`[data-tui-modal-layout]`).style.cssText=`display:flex;flex-direction:column;width:100%;height:100%;min-width:0;min-height:0`,this.querySelector(`[data-tui-modal-header]`).style.cssText=`display:flex;align-items:baseline;justify-content:space-between;flex:0 0 auto;min-width:0`,this.#t.style.cssText=`min-width:0;overflow-wrap:anywhere`,t.style.cssText=`flex:0 0 auto`,this.#n.style.cssText=`flex:1 1 auto;min-width:0;min-height:0;overflow:auto;overflow-wrap:anywhere`,this.#n.append(...e),this.#r.addEventListener(`click`,()=>this.#s()),this.#e.addEventListener(`cancel`,e=>{e.preventDefault(),this.#s()}),this.#e.addEventListener(`close`,()=>{this.#e.open||(this.#e.style.display=`none`,this.removeAttribute(`open`)),this.dispatchEvent(new Event(`close`))})}#s(){let e=new Event(`cancel`,{cancelable:!0});this.dispatchEvent(e)&&this.close()}#c(){if(this.#t.textContent=this.heading,this.#t.hidden=!this.heading,this.heading){this.#t.id=this.#a,this.#e.setAttribute(`aria-labelledby`,this.#a),this.#e.removeAttribute(`aria-label`);return}this.#t.removeAttribute(`id`),this.#e.removeAttribute(`aria-labelledby`),this.#e.setAttribute(`aria-label`,this.getAttribute(`aria-label`)||`Modal`)}#l(){if(this.#e){if(this.open){let e=!this.#e.open;this.#e.open||this.#e.showModal(),this.#e.style.display=`flex`,e&&this.#r.querySelector(`button`)?.focus();return}this.#e.open&&this.#e.close(),this.#e.style.display=`none`}}#u(){let e=[...this.childNodes].filter(e=>e!==this.#e);e.length>0&&this.#n.append(...e)}};customElements.define(`tui-modal`,l);var u=class extends e{static observedAttributes=[`variant`];connectedCallback(){super.connectedCallback()}cacheContent(){this.content===void 0&&(this.content=this.textContent.trim())}get variant(){let e=this.getAttribute(`variant`);return e===`success`||e===`warning`||e===`error`?e:`default`}get variantColor(){return this.variant==="default"?`var(--tui-focus-background)`:`var(--tui-${this.variant}-color)`}get badgeStyle(){return[`font-family:var(--tui-font-family)`,`color:var(--tui-focus-color)`,`background:${this.variantColor}`].join(`;`)}render(){this.cacheContent(),this.innerHTML=`
			<span style="${this.badgeStyle}">
				${this.escape(this.content)}
			</span>
		`}},d=class extends u{};customElements.define(`tui-badge`,u),customElements.define(`tui-tag`,d);var f=class extends e{static observedAttributes=[`variant`];get variant(){let e=this.getAttribute(`variant`);return e===`success`||e===`warning`||e===`error`?e:`default`}get color(){return this.variant==="default"?`var(--tui-color)`:`var(--tui-${this.variant}-color)`}render(){this.style.fontFamily=`var(--tui-font-family)`,this.style.color=this.color}};customElements.define(`tui-text`,f);var ee=class extends e{state={active:!1,focus:!1,hover:!1};static observedAttributes=[`aria-label`,`checked`,`disabled`,`name`,`value`];connectedCallback(){super.connectedCallback()}attributeChangedCallback(e,t,n){if(e===`aria-label`&&this.toggleElement&&t!==n){n===null?this.toggleElement.removeAttribute(e):this.toggleElement.setAttribute(e,n);return}super.attributeChangedCallback()}get checked(){return this.hasAttribute(`checked`)}get blocks(){return this.checked?`░░█`:`▓░░`}get stateActive(){return!this.hasAttribute(`disabled`)&&(this.state.hover||this.state.focus||this.state.active)}get toggleColor(){return this.hasAttribute(`disabled`)?`var(--tui-disabled-color)`:this.checked?`var(--tui-success-color)`:`var(--tui-color)`}get toggleBackground(){return this.stateActive?this.checked?`var(--tui-success-color)`:`var(--tui-focus-background)`:`var(--tui-background-transparent)`}get toggleStyle(){let e=this.stateActive?`var(--tui-focus-color)`:this.toggleColor,t=this.hasAttribute(`disabled`)?`var(--tui-disabled-cursor)`:`var(--tui-action-cursor)`,n=this.stateActive&&this.state.active?`var(--tui-active-text-decoration)`:`var(--tui-text-decoration)`;return[`all:var(--tui-reset-all)`,`font-family:var(--tui-font-family)`,`color:${e}`,`background:${this.toggleBackground}`,`text-decoration:${n}`,`cursor:${t}`,`outline:var(--tui-focus-outline)`].join(`;`)}setState(e,t){this.state[e]!==t&&(this.state[e]=t,this.updateToggleStyle())}updateToggleStyle(){this.toggleElement?.setAttribute(`aria-checked`,String(this.checked)),this.toggleElement?.setAttribute(`style`,this.toggleStyle),this.blocksElement.textContent=this.blocks}setToggleAttribute(e,t){t===null?this.toggleElement.removeAttribute(e):this.toggleElement.setAttribute(e,t)}toggle(){this.hasAttribute(`disabled`)||(this.toggleAttribute(`checked`),this.updateToggleStyle(),this.dispatchEvent(new Event(`input`,{bubbles:!0})),this.dispatchEvent(new Event(`change`,{bubbles:!0})))}bindToggleEvents(){this.toggleElement.addEventListener(`click`,()=>this.toggle()),this.toggleElement.addEventListener(`mouseenter`,()=>this.setState(`hover`,!0)),this.toggleElement.addEventListener(`mouseleave`,()=>{this.setState(`hover`,!1),this.setState(`active`,!1)}),this.toggleElement.addEventListener(`focus`,()=>this.setState(`focus`,!0)),this.toggleElement.addEventListener(`blur`,()=>{this.setState(`focus`,!1),this.setState(`active`,!1)}),this.toggleElement.addEventListener(`pointerdown`,()=>this.setState(`active`,!0)),this.toggleElement.addEventListener(`pointerup`,()=>this.setState(`active`,!1)),this.toggleElement.addEventListener(`pointercancel`,()=>this.setState(`active`,!1)),this.toggleElement.addEventListener(`keydown`,e=>{(e.key===` `||e.key===`Enter`)&&this.setState(`active`,!0)}),this.toggleElement.addEventListener(`keyup`,()=>this.setState(`active`,!1))}mount(){let e=[...this.childNodes];this.state.active=!1,this.state.focus=!1,this.state.hover=!1,this.innerHTML=`
			<button type="button" role="switch">
				<span data-tui-toggle-blocks aria-hidden="true"></span> <span data-tui-toggle-content></span>
			</button>
		`,this.toggleElement=this.querySelector(`button`),this.blocksElement=this.querySelector(`[data-tui-toggle-blocks]`),this.contentElement=this.querySelector(`[data-tui-toggle-content]`),this.contentElement.append(...e),this.bindToggleEvents()}updateToggle(){this.toggleElement.disabled=this.hasAttribute(`disabled`),this.setToggleAttribute(`name`,this.getAttribute(`name`)),this.setToggleAttribute(`value`,this.getAttribute(`value`)),this.setToggleAttribute(`aria-label`,this.getAttribute(`aria-label`)),this.updateToggleStyle()}render(){this.toggleElement||this.mount(),this.updateToggle()}};customElements.define(`tui-toggle`,ee);var p=new Set([`date`,`datetime-local`,`email`,`number`,`password`,`search`,`tel`,`text`,`time`,`url`]),te=class extends e{state={focus:!1,hover:!1};static observedAttributes=[`aria-label`,`aria-labelledby`,`autocomplete`,`block`,`disabled`,`inputmode`,`list`,`max`,`min`,`name`,`placeholder`,`readonly`,`required`,`size`,`step`,`type`,`value`];attributeChangedCallback(e,t,n){if(e===`value`&&this.inputElement&&t!==n){this.inputElement.value=n??``;return}super.attributeChangedCallback()}get type(){let e=this.getAttribute(`type`)??`text`;return p.has(e)?e:`text`}get value(){return this.inputElement?.value??this.getAttribute(`value`)??``}set value(e){this.setAttribute(`value`,e??``)}get active(){return!this.hasAttribute(`disabled`)&&(this.state.focus||this.state.hover)}get color(){return this.hasAttribute(`disabled`)?`var(--tui-disabled-color)`:this.active?`var(--tui-focus-color)`:`var(--tui-color)`}get background(){return this.active?`var(--tui-focus-background)`:`var(--tui-background-transparent)`}get wrapperStyle(){return[...this.hasAttribute(`block`)?[`display:flex`,`width:100%`,`min-width:0`]:[],`color:${this.color}`,`background:${this.background}`].join(`;`)}get inputStyle(){return[`all:var(--tui-reset-all)`,`font-family:var(--tui-font-family)`,`color:${this.color}`,`background:var(--tui-background-transparent)`,`outline:var(--tui-focus-outline)`,...this.hasAttribute(`block`)?[`flex:1 1 auto`,`width:100%`,`min-width:0`]:[]].join(`;`)}optionalAttribute(e){let t=this.getAttribute(e);return t===null?``:` ${e}="${this.escape(t)}"`}booleanAttribute(e){return this.hasAttribute(e)?` ${e}`:``}setState(e,t){this.state[e]!==t&&(this.state[e]=t,this.updateStyle())}updateStyle(){this.wrapperElement?.setAttribute(`style`,this.wrapperStyle),this.inputElement?.setAttribute(`style`,this.inputStyle)}bindEvents(){this.wrapperElement.addEventListener(`mouseenter`,()=>this.setState(`hover`,!0)),this.wrapperElement.addEventListener(`mouseleave`,()=>this.setState(`hover`,!1)),this.inputElement.addEventListener(`focus`,()=>this.setState(`focus`,!0)),this.inputElement.addEventListener(`blur`,()=>this.setState(`focus`,!1))}focus(e){this.inputElement?.focus(e)}select(){this.inputElement?.select()}render(){this.style.display=this.hasAttribute(`block`)?`block`:`inline`,this.style.minWidth=this.hasAttribute(`block`)?`0`:``,this.state.focus=!1,this.state.hover=!1;let e=this.getAttribute(`value`)??``;this.innerHTML=`
			<span data-tui-input style="${this.wrapperStyle}">
				<span aria-hidden="true">[</span><input type="${this.type}" value="${this.escape(e)}" style="${this.inputStyle}"${this.optionalAttribute(`aria-label`)}${this.optionalAttribute(`aria-labelledby`)}${this.optionalAttribute(`autocomplete`)}${this.optionalAttribute(`inputmode`)}${this.optionalAttribute(`list`)}${this.optionalAttribute(`max`)}${this.optionalAttribute(`min`)}${this.optionalAttribute(`name`)}${this.optionalAttribute(`placeholder`)}${this.optionalAttribute(`size`)}${this.optionalAttribute(`step`)}${this.booleanAttribute(`disabled`)}${this.booleanAttribute(`readonly`)}${this.booleanAttribute(`required`)} /><span aria-hidden="true">]</span>
			</span>
		`,this.wrapperElement=this.querySelector(`[data-tui-input]`),this.inputElement=this.querySelector(`input`),this.bindEvents()}};customElements.define(`tui-input`,te);var ne=class extends e{state={focus:!1,hover:!1};static observedAttributes=[`aria-label`,`aria-labelledby`,`block`,`cols`,`disabled`,`name`,`placeholder`,`readonly`,`required`,`rows`,`value`,`wrap`];attributeChangedCallback(e,t,n){if(e===`value`&&this.textareaElement&&t!==n){this.textareaElement.value=n??``;return}super.attributeChangedCallback()}get value(){return this.textareaElement?.value??this.getAttribute(`value`)??``}set value(e){this.setAttribute(`value`,e??``)}get active(){return!this.hasAttribute(`disabled`)&&(this.state.focus||this.state.hover)}get color(){return this.hasAttribute(`disabled`)?`var(--tui-disabled-color)`:this.active?`var(--tui-focus-color)`:`var(--tui-color)`}get background(){return this.active?`var(--tui-focus-background)`:`var(--tui-background-transparent)`}get wrapperStyle(){return[`display:inline-flex`,`align-items:flex-start`,...this.hasAttribute(`block`)?[`width:100%`,`min-width:0`]:[],`color:${this.color}`,`background:${this.background}`].join(`;`)}get textareaStyle(){return[`all:var(--tui-reset-all)`,`font-family:var(--tui-font-family)`,`color:${this.color}`,`background:var(--tui-background-transparent)`,`outline:var(--tui-focus-outline)`,...this.hasAttribute(`block`)?[`flex:1 1 auto`,`width:100%`,`min-width:0`]:[]].join(`;`)}optionalAttribute(e){let t=this.getAttribute(e);return t===null?``:` ${e}="${this.escape(t)}"`}booleanAttribute(e){return this.hasAttribute(e)?` ${e}`:``}setState(e,t){this.state[e]!==t&&(this.state[e]=t,this.updateStyle())}updateStyle(){this.wrapperElement?.setAttribute(`style`,this.wrapperStyle),this.textareaElement?.setAttribute(`style`,this.textareaStyle)}bindEvents(){this.wrapperElement.addEventListener(`mouseenter`,()=>this.setState(`hover`,!0)),this.wrapperElement.addEventListener(`mouseleave`,()=>this.setState(`hover`,!1)),this.textareaElement.addEventListener(`focus`,()=>this.setState(`focus`,!0)),this.textareaElement.addEventListener(`blur`,()=>this.setState(`focus`,!1))}focus(e){this.textareaElement?.focus(e)}select(){this.textareaElement?.select()}render(){this.style.display=this.hasAttribute(`block`)?`block`:`inline`,this.style.minWidth=this.hasAttribute(`block`)?`0`:``,this.state.focus=!1,this.state.hover=!1;let e=this.getAttribute(`value`)??``;this.innerHTML=`
			<span data-tui-textarea style="${this.wrapperStyle}">
				<span aria-hidden="true">[</span><textarea style="${this.textareaStyle}"${this.optionalAttribute(`aria-label`)}${this.optionalAttribute(`aria-labelledby`)}${this.optionalAttribute(`cols`)}${this.optionalAttribute(`name`)}${this.optionalAttribute(`placeholder`)}${this.optionalAttribute(`rows`)}${this.optionalAttribute(`wrap`)}${this.booleanAttribute(`disabled`)}${this.booleanAttribute(`readonly`)}${this.booleanAttribute(`required`)}>${this.escape(e)}</textarea><span aria-hidden="true">]</span>
			</span>
		`,this.wrapperElement=this.querySelector(`[data-tui-textarea]`),this.textareaElement=this.querySelector(`textarea`),this.bindEvents()}};customElements.define(`tui-textarea`,ne);var re=class extends e{optionObserver;state={focus:!1,hover:!1};static observedAttributes=[`aria-label`,`aria-labelledby`,`disabled`,`name`,`required`,`value`];attributeChangedCallback(e,t,n){if(e===`value`&&this.selectElement&&t!==n){this.selectElement.value=n??``;return}super.attributeChangedCallback()}connectedCallback(){super.connectedCallback()}disconnectedCallback(){this.optionObserver?.disconnect()}get configuredValue(){return this.getAttribute(`value`)??[...this.querySelectorAll(`option`)].find(e=>e.selected)?.value??this.querySelector(`option`)?.value??``}get value(){return this.selectElement?.value??this.configuredValue}set value(e){this.setAttribute(`value`,e??``)}get active(){return!this.hasAttribute(`disabled`)&&(this.state.focus||this.state.hover)}get color(){return this.hasAttribute(`disabled`)?`var(--tui-disabled-color)`:this.active?`var(--tui-focus-color)`:`var(--tui-color)`}get background(){return this.active?`var(--tui-focus-background)`:`var(--tui-background-transparent)`}get cursor(){return this.hasAttribute(`disabled`)?`var(--tui-disabled-cursor)`:`var(--tui-action-cursor)`}get wrapperStyle(){return[`color:${this.color}`,`background:${this.background}`,`cursor:${this.cursor}`].join(`;`)}get selectStyle(){return[`all:var(--tui-reset-all)`,`font-family:var(--tui-font-family)`,`color:${this.color}`,`background:var(--tui-background-transparent)`,`cursor:${this.cursor}`,`outline:var(--tui-focus-outline)`].join(`;`)}optionalAttribute(e){let t=this.getAttribute(e);return t===null?``:` ${e}="${this.escape(t)}"`}booleanAttribute(e){return this.hasAttribute(e)?` ${e}`:``}setState(e,t){this.state[e]!==t&&(this.state[e]=t,this.updateStyle())}updateStyle(){this.wrapperElement?.setAttribute(`style`,this.wrapperStyle),this.selectElement?.setAttribute(`style`,this.selectStyle)}bindEvents(){this.wrapperElement.addEventListener(`mouseenter`,()=>this.setState(`hover`,!0)),this.wrapperElement.addEventListener(`mouseleave`,()=>this.setState(`hover`,!1)),this.selectElement.addEventListener(`focus`,()=>this.setState(`focus`,!0)),this.selectElement.addEventListener(`blur`,()=>this.setState(`focus`,!1))}mount(){let e=[...this.childNodes];this.innerHTML=`
			<span data-tui-select>
				<span aria-hidden="true">[</span><select></select><span aria-hidden="true">▼]</span>
			</span>
		`,this.wrapperElement=this.querySelector(`[data-tui-select]`),this.selectElement=this.querySelector(`select`),this.selectElement.append(...e),this.bindEvents(),this.optionObserver=new MutationObserver(()=>{let e=this.getAttribute(`value`);e!==null&&(this.selectElement.value=e)}),this.optionObserver.observe(this.selectElement,{childList:!0,subtree:!0})}setOptionalAttribute(e){let t=this.getAttribute(e);t===null?this.selectElement.removeAttribute(e):this.selectElement.setAttribute(e,t)}updateSelect(){for(let e of[`aria-label`,`aria-labelledby`,`name`])this.setOptionalAttribute(e);this.selectElement.disabled=this.hasAttribute(`disabled`),this.selectElement.required=this.hasAttribute(`required`),this.wrapperElement.setAttribute(`style`,this.wrapperStyle),this.selectElement.setAttribute(`style`,this.selectStyle),this.selectElement.value=this.configuredValue}focus(e){this.selectElement?.focus(e)}render(){this.selectElement||(this.state.focus=!1,this.state.hover=!1,this.mount()),this.updateSelect()}};customElements.define(`tui-select`,re);var m=class extends e{static observedAttributes=[`aria-label`,`columns`,`max`,`value`];get value(){let e=Number(this.getAttribute(`value`));return Number.isFinite(e)?e:0}get max(){let e=Number(this.getAttribute(`max`));return Number.isFinite(e)&&e>0?e:100}get columns(){let e=Number.parseInt(this.getAttribute(`columns`),10);return Number.isFinite(e)&&e>0?e:20}render(){let e=Math.max(0,Math.min(1,this.value/this.max)),t=Math.round(e*this.columns),n=Math.round(e*100),r=this.getAttribute(`aria-label`)||`Progress`;this.innerHTML=`
			<span role="progressbar" aria-label="${this.escape(r)}" aria-valuemin="0" aria-valuemax="${this.max}" aria-valuenow="${this.value}">
				<span aria-hidden="true">[${`█`.repeat(t)}${`░`.repeat(this.columns-t)}] ${n}%</span>
			</span>
		`}};customElements.define(`tui-progress`,m);var ie=class extends e{};customElements.define(`tui-radio-button`,ie);var ae=class extends e{state={active:``,focus:``,hover:``};static observedAttributes=[`aria-label`,`disabled`,`inverted`,`name`,`value`];connectedCallback(){super.connectedCallback()}cacheOptions(){this.options===void 0&&(this.options=[...this.querySelectorAll(`tui-radio-button`)].map(e=>({disabled:e.hasAttribute(`disabled`),label:e.textContent.trim(),value:e.getAttribute(`value`)??e.textContent.trim(),checked:e.hasAttribute(`checked`)})))}get value(){let e=this.getAttribute(`value`),t=this.options?.find(e=>e.checked);return e??t?.value??``}get enabledOptions(){return this.options.filter(e=>!e.disabled)}optionChecked(e){return this.value===e.value}optionDisabled(e){return this.hasAttribute(`disabled`)||e.disabled}optionActive(e){return!this.optionDisabled(e)&&(this.state.hover===e.value||this.state.focus===e.value||this.state.active===e.value)}optionColor(e){return this.optionDisabled(e)?`var(--tui-disabled-color)`:this.hasAttribute(`inverted`)?this.optionActive(e)||this.optionChecked(e)?`var(--tui-color)`:`var(--tui-background)`:this.optionActive(e)||this.optionChecked(e)?`var(--tui-focus-color)`:`var(--tui-color)`}optionBackground(e){return this.optionActive(e)||this.optionChecked(e)?this.hasAttribute(`inverted`)?`var(--tui-background)`:`var(--tui-focus-background)`:`var(--tui-background-transparent)`}optionCursor(e){return this.optionDisabled(e)?`var(--tui-disabled-cursor)`:`var(--tui-action-cursor)`}optionTextDecoration(e){return this.state.active===e.value?`var(--tui-active-text-decoration)`:`var(--tui-text-decoration)`}optionStyle(e){return[`all:var(--tui-reset-all)`,`font-family:var(--tui-font-family)`,`color:${this.optionColor(e)}`,`background:${this.optionBackground(e)}`,`text-decoration:${this.optionTextDecoration(e)}`,`cursor:${this.optionCursor(e)}`,`outline:var(--tui-focus-outline)`].join(`;`)}optionTabIndex(e){return this.optionDisabled(e)?`-1`:this.value===``?this.enabledOptions[0]?.value===e.value?`0`:`-1`:this.optionChecked(e)?`0`:`-1`}setState(e,t){this.state[e]!==t&&(this.state[e]=t,this.updateOptions())}updateOptions(){for(let e of this.querySelectorAll(`button`)){let t=this.options.find(t=>t.value===e.getAttribute(`value`));e.setAttribute(`aria-checked`,String(this.optionChecked(t))),e.setAttribute(`style`,this.optionStyle(t)),e.setAttribute(`tabindex`,this.optionTabIndex(t))}this.inputElement?.setAttribute(`value`,this.value)}select(e){let t=this.options.find(t=>t.value===e);t===void 0||this.optionDisabled(t)||this.value===t.value||(this.setAttribute(`value`,t.value),this.updateOptions(),this.dispatchEvent(new Event(`input`,{bubbles:!0})),this.dispatchEvent(new Event(`change`,{bubbles:!0})))}focusNextOption(e,t){let n=this.enabledOptions;if(n.length===0)return;let r=n.findIndex(t=>t.value===e),i=n.at((r+t+n.length)%n.length);this.select(i.value),this.querySelector(`button[value="${CSS.escape(i.value)}"]`)?.focus()}bindOptionEvents(){for(let e of this.querySelectorAll(`button`)){let t=e.getAttribute(`value`);e.addEventListener(`click`,()=>this.select(t)),e.addEventListener(`mouseenter`,()=>this.setState(`hover`,t)),e.addEventListener(`mouseleave`,()=>{this.setState(`hover`,``),this.setState(`active`,``)}),e.addEventListener(`focus`,()=>this.setState(`focus`,t)),e.addEventListener(`blur`,()=>{this.setState(`focus`,``),this.setState(`active`,``)}),e.addEventListener(`pointerdown`,()=>this.setState(`active`,t)),e.addEventListener(`pointerup`,()=>this.setState(`active`,``)),e.addEventListener(`pointercancel`,()=>this.setState(`active`,``)),e.addEventListener(`keydown`,e=>{(e.key===` `||e.key===`Enter`)&&this.setState(`active`,t),(e.key===`ArrowRight`||e.key===`ArrowDown`)&&(e.preventDefault(),this.focusNextOption(t,1)),(e.key===`ArrowLeft`||e.key===`ArrowUp`)&&(e.preventDefault(),this.focusNextOption(t,-1))}),e.addEventListener(`keyup`,()=>this.setState(`active`,``))}}renderOption(e){let t=this.optionDisabled(e)?` disabled`:``;return`<button type="button" role="radio" aria-checked="${this.optionChecked(e)}" value="${this.escape(e.value)}" tabindex="${this.optionTabIndex(e)}" style="${this.optionStyle(e)}"${t}>${this.escape(e.label)}</button>`}renderOptions(){return this.options.map(e=>this.renderOption(e)).join(`<span aria-hidden="true">&nbsp;|&nbsp;</span>`)}render(){this.cacheOptions(),this.state.active=``,this.state.focus=``,this.state.hover=``;let e=this.getAttribute(`name`),t=this.getAttribute(`aria-label`),n=t===null?``:` aria-label="${this.escape(t)}"`,r=this.hasAttribute(`disabled`)?` disabled`:``,i=e===null?``:`<input type="hidden" name="${this.escape(e)}" value="${this.escape(this.value)}"${r} />`;this.innerHTML=`
			<span role="radiogroup"${n}>
				<span aria-hidden="true">[</span>${this.renderOptions()}<span aria-hidden="true">]</span>
			</span>
			${i}
		`,this.inputElement=this.querySelector(`input`),this.bindOptionEvents()}};customElements.define(`tui-radio-buttonset`,ae);var oe=`▁▂▃▄▅▆▇█`,se=new Set([`success`,`warning`,`error`]);function h(e){if(e==null||e===``)return;let t=Number(e);return Number.isFinite(t)?t:void 0}var ce=class extends e{#e=[];static observedAttributes=[`above-variant`,`aria-label`,`below-variant`,`columns`,`max`,`min`,`threshold`,`variant`];get values(){return this.#e}set values(e){this.#e=Array.isArray(e)?e:[],this.isConnected&&this.render()}get columns(){let e=Number.parseInt(this.getAttribute(`columns`),10);return Number.isFinite(e)&&e>0?e:40}attributeNumber(e){let t=this.getAttribute(e);if(t===null||t===``)return;let n=Number(t);return Number.isFinite(n)?n:void 0}variant(e){let t=this.getAttribute(e);return se.has(t)?t:void 0}sampledValues(){return this.#e.length===0||this.#e.length===this.columns?this.#e:this.#e.length<this.columns?this.#e.length===1?Array(this.columns).fill(this.#e[0]):Array.from({length:this.columns},(e,t)=>{let n=t*(this.#e.length-1)/(this.columns-1),r=Math.floor(n),i=Math.ceil(n),a=h(this.#e[r]),o=h(this.#e[i]);if(Number.isFinite(a)&&Number.isFinite(o))return a+(o-a)*(n-r)}):Array.from({length:this.columns},(e,t)=>{let n=Math.floor(t*this.#e.length/this.columns),r=Math.max(n+1,Math.floor((t+1)*this.#e.length/this.columns)),i=this.#e.slice(n,r).map(h).filter(Number.isFinite);if(i.length!==0)return i.reduce((e,t)=>e+t,0)/i.length})}render(){let e=this.sampledValues(),t=e.map(h).filter(Number.isFinite),n=this.attributeNumber(`min`)??Math.min(...t),r=(this.attributeNumber(`max`)??Math.max(...t))-n,i=this.attributeNumber(`threshold`),a=this.variant(`above-variant`),o=this.variant(`below-variant`),s=this.variant(`variant`),c=this.getAttribute(`aria-label`)??`Trend`,l=e.map(e=>{let t=h(e);return Number.isFinite(t)?{glyph:!Number.isFinite(r)||r===0?oe[3]:oe[Math.round(Math.max(0,Math.min(1,(t-n)/r))*7)],variant:i===void 0?s:t>i?a:t<i?o:s}:{glyph:` `,variant:void 0}}),u=[];for(let e of l){let t=u.at(-1);t&&t.variant===e.variant?t.glyphs+=e.glyph:u.push({glyphs:e.glyph,variant:e.variant})}let d=u.map(({glyphs:e,variant:t})=>`<span${t?` style="color:var(--tui-${t}-color)"`:``}>${e}</span>`).join(``);this.innerHTML=`<span role="img" aria-label="${this.escape(c)}"><span aria-hidden="true">${d}</span></span>`}};customElements.define(`tui-sparkline`,ce);var le=new Set([`success`,`warning`,`error`]),ue=[[1,2,4,64],[8,16,32,128]];function g(e){if(e==null||e===``)return;let t=Number(e);return Number.isFinite(t)?t:void 0}var de=class extends e{#e=[];#t=40;#n;static observedAttributes=[`above-variant`,`aria-label`,`below-variant`,`columns`,`height`,`max`,`min`,`threshold`];get values(){return this.#e}set values(e){this.#e=Array.isArray(e)?e:[],this.isConnected&&this.render()}get columns(){let e=Number.parseInt(this.getAttribute(`columns`),10);return Number.isFinite(e)&&e>0?e:this.#t}get height(){let e=Number.parseInt(this.getAttribute(`height`),10);return Number.isFinite(e)&&e>0?e:1}attributeNumber(e){let t=this.getAttribute(e);if(t===null||t===``)return;let n=Number(t);return Number.isFinite(n)?n:void 0}variant(e){let t=this.getAttribute(e);return le.has(t)?t:void 0}connectedCallback(){this.style.display=`block`,this.style.minWidth=`0`,this.style.overflow=`hidden`,this.style.whiteSpace=`nowrap`,super.connectedCallback(),typeof ResizeObserver<`u`&&(this.#n=new ResizeObserver(()=>this.#r()),this.#n.observe(this),queueMicrotask(()=>this.#r()))}disconnectedCallback(){this.#n?.disconnect()}#r(){let e=this.getBoundingClientRect().width;if(!(e>0))return;let t=document.createElement(`canvas`).getContext(`2d`);if(!t)return;let n=getComputedStyle(this);t.font=n.font||`${n.fontSize} ${n.fontFamily}`;let r=t.measureText(`⣿`).width;if(!(r>0))return;let i=Math.max(1,Math.floor(e/r));i!==this.#t&&(this.#t=i,this.hasAttribute(`columns`)||this.render())}sampledValues(){let e=this.columns*2;return this.#e.length===0||this.#e.length===e?this.#e:this.#e.length<e?this.#e.length===1?Array(e).fill(this.#e[0]):Array.from({length:e},(t,n)=>{let r=n*(this.#e.length-1)/(e-1),i=Math.floor(r),a=Math.ceil(r),o=g(this.#e[i]),s=g(this.#e[a]);if(Number.isFinite(o)&&Number.isFinite(s))return o+(s-o)*(r-i)}):Array.from({length:this.columns},(e,t)=>{let n=Math.floor(t*this.#e.length/this.columns),r=Math.max(n+1,Math.floor((t+1)*this.#e.length/this.columns)),i=this.#e.slice(n,r).map((e,t)=>({index:t,value:g(e)})).filter(({value:e})=>Number.isFinite(e));if(i.length===0)return[void 0,void 0];let a=i[0],o=i[0];for(let e of i.slice(1))e.value<a.value&&(a=e),e.value>o.value&&(o=e);return a.index<=o.index?[a.value,o.value]:[o.value,a.value]}).flat()}pixelFor(e,t,n){let r=g(e);if(!Number.isFinite(r))return;let i=this.height*4,a=n-t;if(!Number.isFinite(a)||a===0)return Math.floor((i-1)/2);let o=Math.max(0,Math.min(1,(n-r)/a));return Math.min(i-1,Math.floor(o*i))}drawLine(e,t,n){let r=t.x,i=t.y,a=Math.abs(n.x-t.x),o=-Math.abs(n.y-t.y),s=t.x<n.x?1:-1,c=t.y<n.y?1:-1,l=a+o;for(;e[i][r]=1,r!==n.x||i!==n.y;){let e=l*2;e>=o&&(l+=o,r+=s),e<=a&&(l+=a,i+=c)}}rowsFor(e,t,n){let r=Array.from({length:this.height*4},()=>new Uint8Array(e.length)),i;for(let[a,o]of e.entries()){let e=this.pixelFor(o,t,n);if(e===void 0){i=void 0;continue}let s={x:a,y:e};i?this.drawLine(r,i,s):r[e][a]=1,i=s}let a=Array.from({length:this.height},()=>[]);for(let e=0;e<this.columns;e+=1)for(let t=0;t<this.height;t+=1){let n=0;for(let i=0;i<2;i+=1){let a=e*2+i;for(let e=0;e<4;e+=1)r[t*4+e][a]&&(n|=ue[i][e])}a[t].push(String.fromCodePoint(10240+n))}return a.map(e=>e.join(``))}thresholdScale(e,t,n){if(n===void 0||!Number.isFinite(e)||!Number.isFinite(t)||t<=e)return{minimum:e,maximum:t,thresholdRow:void 0};if(n<=e)return{minimum:e,maximum:t,thresholdRow:this.height};if(n>=t)return{minimum:e,maximum:t,thresholdRow:0};if(this.height<2)return{minimum:e,maximum:t,thresholdRow:void 0};let r=t-n,i=n-e,a;for(let e=1;e<this.height;e+=1){let t=this.height-e,n=Math.max(r/e,i/t);(!a||n<a.rangePerRow)&&(a={aboveRows:e,belowRows:t,rangePerRow:n})}return{minimum:n-a.rangePerRow*a.belowRows,maximum:n+a.rangePerRow*a.aboveRows,thresholdRow:a.aboveRows}}rowVariant(e,t){if(t!==void 0)return e<t?this.variant(`above-variant`):this.variant(`below-variant`)}singleRowMarkup(e,t,n){let r=[];for(let[i,a]of[...e].entries()){let e=t.slice(i*2,i*2+2).map(g).filter(Number.isFinite),o;e.length>0&&e.every(e=>e>n)?o=this.variant(`above-variant`):e.length>0&&e.every(e=>e<n)&&(o=this.variant(`below-variant`));let s=r.at(-1);s&&s.variant===o?s.glyphs+=a:r.push({glyphs:a,variant:o})}return r.map(({glyphs:e,variant:t})=>`<span${t?` style="color:var(--tui-${t}-color)"`:``}>${e}</span>`).join(``)}render(){let e=this.sampledValues(),t=e.map(g).filter(Number.isFinite),n=this.attributeNumber(`min`)??Math.min(...t),r=this.attributeNumber(`max`)??Math.max(...t),i=this.attributeNumber(`threshold`),a=this.thresholdScale(n,r,i),o=this.getAttribute(`aria-label`)??`Chart`,s=this.rowsFor(e,a.minimum,a.maximum).map((t,n)=>{if(this.height===1&&i!==void 0&&a.thresholdRow===void 0)return`<span data-tui-chart-row="${n}">${this.singleRowMarkup(t,e,i)}</span>`;let r=this.rowVariant(n,a.thresholdRow);return`<span data-tui-chart-row="${n}"${r?` style="color:var(--tui-${r}-color)"`:``}>${t}</span>`}).join(`<br>`);this.innerHTML=`<span role="img" aria-label="${this.escape(o)}"><span aria-hidden="true">${s}</span></span>`}};customElements.define(`tui-chart`,de);var _=globalThis,fe=_.ShadowRoot&&(_.ShadyCSS===void 0||_.ShadyCSS.nativeShadow)&&`adoptedStyleSheets`in Document.prototype&&`replace`in CSSStyleSheet.prototype,pe=Symbol(),me=new WeakMap,he=class{constructor(e,t,n){if(this._$cssResult$=!0,n!==pe)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,t=this.t;if(fe&&e===void 0){let n=t!==void 0&&t.length===1;n&&(e=me.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),n&&me.set(t,e))}return e}toString(){return this.cssText}},ge=e=>new he(typeof e==`string`?e:e+``,void 0,pe),_e=(e,t)=>{if(fe)e.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let n of t){let t=document.createElement(`style`),r=_.litNonce;r!==void 0&&t.setAttribute(`nonce`,r),t.textContent=n.cssText,e.appendChild(t)}},ve=fe?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t=``;for(let n of e.cssRules)t+=n.cssText;return ge(t)})(e):e,{is:ye,defineProperty:be,getOwnPropertyDescriptor:xe,getOwnPropertyNames:Se,getOwnPropertySymbols:Ce,getPrototypeOf:we}=Object,v=globalThis,Te=v.trustedTypes,Ee=Te?Te.emptyScript:``,De=v.reactiveElementPolyfillSupport,y=(e,t)=>e,Oe={toAttribute(e,t){switch(t){case Boolean:e=e?Ee:null;break;case Object:case Array:e=e==null?e:JSON.stringify(e)}return e},fromAttribute(e,t){let n=e;switch(t){case Boolean:n=e!==null;break;case Number:n=e===null?null:Number(e);break;case Object:case Array:try{n=JSON.parse(e)}catch{n=null}}return n}},ke=(e,t)=>!ye(e,t),Ae={attribute:!0,type:String,converter:Oe,reflect:!1,useDefault:!1,hasChanged:ke};Symbol.metadata??=Symbol(`metadata`),v.litPropertyMetadata??=new WeakMap;var b=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=Ae){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){let n=Symbol(),r=this.getPropertyDescriptor(e,n,t);r!==void 0&&be(this.prototype,e,r)}}static getPropertyDescriptor(e,t,n){let{get:r,set:i}=xe(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:r,set(t){let a=r?.call(this);i?.call(this,t),this.requestUpdate(e,a,n)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??Ae}static _$Ei(){if(this.hasOwnProperty(y(`elementProperties`)))return;let e=we(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(y(`finalized`)))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(y(`properties`))){let e=this.properties,t=[...Se(e),...Ce(e)];for(let n of t)this.createProperty(n,e[n])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[e,n]of t)this.elementProperties.set(e,n)}this._$Eh=new Map;for(let[e,t]of this.elementProperties){let n=this._$Eu(e,t);n!==void 0&&this._$Eh.set(n,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let n=new Set(e.flat(1/0).reverse());for(let e of n)t.unshift(ve(e))}else e!==void 0&&t.push(ve(e));return t}static _$Eu(e,t){let n=t.attribute;return!1===n?void 0:typeof n==`string`?n:typeof e==`string`?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let n of t.keys())this.hasOwnProperty(n)&&(e.set(n,this[n]),delete this[n]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return _e(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,n){this._$AK(e,n)}_$ET(e,t){let n=this.constructor.elementProperties.get(e),r=this.constructor._$Eu(e,n);if(r!==void 0&&!0===n.reflect){let i=(n.converter?.toAttribute===void 0?Oe:n.converter).toAttribute(t,n.type);this._$Em=e,i==null?this.removeAttribute(r):this.setAttribute(r,i),this._$Em=null}}_$AK(e,t){let n=this.constructor,r=n._$Eh.get(e);if(r!==void 0&&this._$Em!==r){let e=n.getPropertyOptions(r),i=typeof e.converter==`function`?{fromAttribute:e.converter}:e.converter?.fromAttribute===void 0?Oe:e.converter;this._$Em=r;let a=i.fromAttribute(t,e.type);this[r]=a??this._$Ej?.get(r)??a,this._$Em=null}}requestUpdate(e,t,n,r=!1,i){if(e!==void 0){let a=this.constructor;if(!1===r&&(i=this[e]),n??=a.getPropertyOptions(e),!((n.hasChanged??ke)(i,t)||n.useDefault&&n.reflect&&i===this._$Ej?.get(e)&&!this.hasAttribute(a._$Eu(e,n))))return;this.C(e,t,n)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:n,reflect:r,wrapped:i},a){n&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,a??t??this[e]),!0!==i||a!==void 0)||(this._$AL.has(e)||(this.hasUpdated||n||(t=void 0),this._$AL.set(e,t)),!0===r&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}let e=this.constructor.elementProperties;if(e.size>0)for(let[t,n]of e){let{wrapped:e}=n,r=this[t];!0!==e||this._$AL.has(t)||r===void 0||this.C(t,void 0,n,r)}}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};b.elementStyles=[],b.shadowRootOptions={mode:`open`},b[y(`elementProperties`)]=new Map,b[y(`finalized`)]=new Map,De?.({ReactiveElement:b}),(v.reactiveElementVersions??=[]).push(`2.1.2`);var x=globalThis,je=e=>e,S=x.trustedTypes,Me=S?S.createPolicy(`lit-html`,{createHTML:e=>e}):void 0,Ne=`$lit$`,C=`lit$${Math.random().toFixed(9).slice(2)}$`,Pe=`?`+C,Fe=`<${Pe}>`,w=document,T=()=>w.createComment(``),E=e=>e===null||typeof e!=`object`&&typeof e!=`function`,D=Array.isArray,Ie=e=>D(e)||typeof e?.[Symbol.iterator]==`function`,O=`[
\f\r]`,k=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Le=/-->/g,Re=/>/g,A=RegExp(`>|${O}(?:([^\\s"'>=/]+)(${O}*=${O}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,`g`),ze=/'/g,Be=/"/g,Ve=/^(?:script|style|textarea|title)$/i,j=(e=>(t,...n)=>({_$litType$:e,strings:t,values:n}))(1),M=Symbol.for(`lit-noChange`),N=Symbol.for(`lit-nothing`),He=new WeakMap,P=w.createTreeWalker(w,129);function Ue(e,t){if(!D(e)||!e.hasOwnProperty(`raw`))throw Error(`invalid template strings array`);return Me===void 0?t:Me.createHTML(t)}var We=(e,t)=>{let n=e.length-1,r=[],i,a=t===2?`<svg>`:t===3?`<math>`:``,o=k;for(let t=0;t<n;t++){let n=e[t],s,c,l=-1,u=0;for(;u<n.length&&(o.lastIndex=u,c=o.exec(n),c!==null);)u=o.lastIndex,o===k?c[1]===`!--`?o=Le:c[1]===void 0?c[2]===void 0?c[3]!==void 0&&(o=A):(Ve.test(c[2])&&(i=RegExp(`</`+c[2],`g`)),o=A):o=Re:o===A?c[0]===`>`?(o=i??k,l=-1):c[1]===void 0?l=-2:(l=o.lastIndex-c[2].length,s=c[1],o=c[3]===void 0?A:c[3]===`"`?Be:ze):o===Be||o===ze?o=A:o===Le||o===Re?o=k:(o=A,i=void 0);let d=o===A&&e[t+1].startsWith(`/>`)?` `:``;a+=o===k?n+Fe:l>=0?(r.push(s),n.slice(0,l)+Ne+n.slice(l)+C+d):n+C+(l===-2?t:d)}return[Ue(e,a+(e[n]||`<?>`)+(t===2?`</svg>`:t===3?`</math>`:``)),r]},F=class e{constructor({strings:t,_$litType$:n},r){let i;this.parts=[];let a=0,o=0,s=t.length-1,c=this.parts,[l,u]=We(t,n);if(this.el=e.createElement(l,r),P.currentNode=this.el.content,n===2||n===3){let e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;(i=P.nextNode())!==null&&c.length<s;){if(i.nodeType===1){if(i.hasAttributes())for(let e of i.getAttributeNames())if(e.endsWith(Ne)){let t=u[o++],n=i.getAttribute(e).split(C),r=/([.?@])?(.*)/.exec(t);c.push({type:1,index:a,name:r[2],strings:n,ctor:r[1]===`.`?qe:r[1]===`?`?Je:r[1]===`@`?Ye:L}),i.removeAttribute(e)}else e.startsWith(C)&&(c.push({type:6,index:a}),i.removeAttribute(e));if(Ve.test(i.tagName)){let e=i.textContent.split(C),t=e.length-1;if(t>0){i.textContent=S?S.emptyScript:``;for(let n=0;n<t;n++)i.append(e[n],T()),P.nextNode(),c.push({type:2,index:++a});i.append(e[t],T())}}}else if(i.nodeType===8){if(i.data===Pe)c.push({type:2,index:a});else{let e=-1;for(;(e=i.data.indexOf(C,e+1))!==-1;)c.push({type:7,index:a}),e+=C.length-1}}a++}}static createElement(e,t){let n=w.createElement(`template`);return n.innerHTML=e,n}};function I(e,t,n=e,r){if(t===M)return t;let i=r===void 0?n._$Cl:n._$Co?.[r],a=E(t)?void 0:t._$litDirective$;return i?.constructor!==a&&(i?._$AO?.(!1),a===void 0?i=void 0:(i=new a(e),i._$AT(e,n,r)),r===void 0?n._$Cl=i:(n._$Co??=[])[r]=i),i!==void 0&&(t=I(e,i._$AS(e,t.values),i,r)),t}var Ge=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:n}=this._$AD,r=(e?.creationScope??w).importNode(t,!0);P.currentNode=r;let i=P.nextNode(),a=0,o=0,s=n[0];for(;s!==void 0;){if(a===s.index){let t;s.type===2?t=new Ke(i,i.nextSibling,this,e):s.type===1?t=new s.ctor(i,s.name,s.strings,this,e):s.type===6&&(t=new Xe(i,this,e)),this._$AV.push(t),s=n[++o]}a!==s?.index&&(i=P.nextNode(),a++)}return P.currentNode=w,r}p(e){let t=0;for(let n of this._$AV)n!==void 0&&(n.strings===void 0?n._$AI(e[t]):(n._$AI(e,n,t),t+=n.strings.length-2)),t++}},Ke=class e{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,n,r){this.type=2,this._$AH=N,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=n,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=I(this,e,t),E(e)?e===N||e==null||e===``?(this._$AH!==N&&this._$AR(),this._$AH=N):e!==this._$AH&&e!==M&&this._(e):e._$litType$===void 0?e.nodeType===void 0?Ie(e)?this.k(e):this._(e):this.T(e):this.$(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==N&&E(this._$AH)?this._$AA.nextSibling.data=e:this.T(w.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:n}=e,r=typeof n==`number`?this._$AC(e):(n.el===void 0&&(n.el=F.createElement(Ue(n.h,n.h[0]),this.options)),n);if(this._$AH?._$AD===r)this._$AH.p(t);else{let e=new Ge(r,this),n=e.u(this.options);e.p(t),this.T(n),this._$AH=e}}_$AC(e){let t=He.get(e.strings);return t===void 0&&He.set(e.strings,t=new F(e)),t}k(t){D(this._$AH)||(this._$AH=[],this._$AR());let n=this._$AH,r,i=0;for(let a of t)i===n.length?n.push(r=new e(this.O(T()),this.O(T()),this,this.options)):r=n[i],r._$AI(a),i++;i<n.length&&(this._$AR(r&&r._$AB.nextSibling,i),n.length=i)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){let t=je(e).nextSibling;je(e).remove(),e=t}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},L=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,n,r,i){this.type=1,this._$AH=N,this._$AN=void 0,this.element=e,this.name=t,this._$AM=r,this.options=i,n.length>2||n[0]!==``||n[1]!==``?(this._$AH=Array(n.length-1).fill(new String),this.strings=n):this._$AH=N}_$AI(e,t=this,n,r){let i=this.strings,a=!1;if(i===void 0)e=I(this,e,t,0),a=!E(e)||e!==this._$AH&&e!==M,a&&(this._$AH=e);else{let r=e,o,s;for(e=i[0],o=0;o<i.length-1;o++)s=I(this,r[n+o],t,o),s===M&&(s=this._$AH[o]),a||=!E(s)||s!==this._$AH[o],s===N?e=N:e!==N&&(e+=(s??``)+i[o+1]),this._$AH[o]=s}a&&!r&&this.j(e)}j(e){e===N?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??``)}},qe=class extends L{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===N?void 0:e}},Je=class extends L{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==N)}},Ye=class extends L{constructor(e,t,n,r,i){super(e,t,n,r,i),this.type=5}_$AI(e,t=this){if((e=I(this,e,t,0)??N)===M)return;let n=this._$AH,r=e===N&&n!==N||e.capture!==n.capture||e.once!==n.once||e.passive!==n.passive,i=e!==N&&(n===N||r);r&&this.element.removeEventListener(this.name,this,n),i&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH==`function`?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},Xe=class{constructor(e,t,n){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=n}get _$AU(){return this._$AM._$AU}_$AI(e){I(this,e)}},Ze=x.litHtmlPolyfillSupport;Ze?.(F,Ke),(x.litHtmlVersions??=[]).push(`3.3.3`);var Qe=(e,t,n)=>{let r=n?.renderBefore??t,i=r._$litPart$;if(i===void 0){let e=n?.renderBefore??null;r._$litPart$=i=new Ke(t.insertBefore(T(),e),e,void 0,n??{})}return i._$AI(e),i},$e=globalThis,R=class extends b{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=Qe(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return M}};R._$litElement$=!0,R.finalized=!0,$e.litElementHydrateSupport?.({LitElement:R});var et=$e.litElementPolyfillSupport;et?.({LitElement:R}),($e.litElementVersions??=[]).push(`4.2.2`);async function z(e,{signal:t}={}){let n=await fetch(e,{headers:{Accept:`application/json`},signal:t});if(!n.ok)throw Error(`${n.status} ${n.statusText}`);return n.json()}async function tt(e,t,n,{signal:r}={}){let i=await fetch(e,{method:t,headers:{Accept:`application/json`,...n===void 0?{}:{"Content-Type":`application/json`}},...n===void 0?{}:{body:JSON.stringify(n)},signal:r}),a=await i.json().catch(()=>void 0);if(!i.ok)throw Error(a?.detail??`${i.status} ${i.statusText}`);return a}function B(e,t,n){return tt(e,`PUT`,t,n)}function V(e,t,n){return tt(e,`POST`,t,n)}function H(e,t){return tt(e,`DELETE`,void 0,t)}var U=class{value;error;loading=!0;#e;#t;#n;#r;#i;#a=!1;constructor(e,t,{interval:n=3e4}={}){this.#e=e,this.#t=t,this.#n=n,e.addController(this)}hostConnected(){this.#a=!0,this.refresh()}hostDisconnected(){this.#a=!1,clearTimeout(this.#r),this.#i?.abort()}async refresh(){clearTimeout(this.#r),this.#i?.abort();let e=new AbortController;this.#i=e,this.loading=!0,this.error=void 0,this.#e.requestUpdate();try{this.value=await this.#t(e.signal)}catch(e){e.name!==`AbortError`&&(this.error=e)}finally{this.#i===e&&(this.loading=!1,this.#i=void 0,this.#e.requestUpdate(),this.#a&&this.#n>0&&(this.#r=setTimeout(()=>this.refresh(),this.#n)))}}};function W(e,t=`EUR`,n=2){return e==null?`-`:new Intl.NumberFormat(`en-EU`,{style:`currency`,currency:t,minimumFractionDigits:n,maximumFractionDigits:n}).format(e)}function G(e,t=2){return e==null?`-`:`${e>0?`+`:``}${e.toFixed(t)}%`}function K(e,t=0){let n=Number(e);return Number.isFinite(n)?n.toLocaleString(`en-GB`,{minimumFractionDigits:t,maximumFractionDigits:t}):`-`}function nt(e,{seconds:t=!1}={}){if(e==null||e===``)return`-`;let n=t?new Date(Number(e)*1e3):new Date(e);return Number.isNaN(n.getTime())?`-`:n.toLocaleString(`en-GB`,{day:`2-digit`,month:`short`,year:`numeric`,hour:`2-digit`,minute:`2-digit`})}function q(e){if(!e)return`-`;let t=new Date(e);if(Number.isNaN(t.getTime()))return`-`;let n=Math.round((t.getTime()-Date.now())/1e3),r=Math.abs(n),i=new Intl.RelativeTimeFormat(`en`,{numeric:`auto`});return r<60?i.format(n,`second`):r<3600?i.format(Math.round(n/60),`minute`):r<86400?i.format(Math.round(n/3600),`hour`):i.format(Math.round(n/86400),`day`)}function J(e){let t=Number(e);if(!Number.isFinite(t))return`-`;if(t<1e3)return`${Math.round(t)} ms`;let n=t/1e3;return n<60?`${n.toFixed(+(n<10))} sec`:`${Math.floor(n/60)} min ${Math.round(n%60)} sec`}function Y(e){if([`completed`,`done`,`fresh`,`enabled`].includes(e))return`success`;if([`failed`,`error`,`invalid`].includes(e))return`error`;if([`queued`,`running`,`stale`].includes(e))return`warning`}function rt(e){let t=e.getTimezoneOffset()*6e4;return new Date(e.getTime()-t).toISOString().slice(0,10)}var it={prepare_db:`Preparing database…`,discover_symbols:`Discovering securities…`,download_prices:`Downloading historical data…`,calculate_scores:`Calculating scores…`,simulate:`Running simulation…`},at=class extends R{static properties={startDate:{state:!0},endDate:{state:!0},initialCapital:{state:!0},monthlyDeposit:{state:!0},rebalanceFrequency:{state:!0},useExistingUniverse:{state:!0},pickRandom:{state:!0},randomCount:{state:!0},symbols:{state:!0},status:{state:!0},progress:{state:!0},currentDate:{state:!0},portfolioValue:{state:!0},errorMessage:{state:!0},phase:{state:!0},currentItem:{state:!0},itemsDone:{state:!0},itemsTotal:{state:!0},result:{state:!0}};constructor(){super();let e=new Date;e.setDate(e.getDate()-1);let t=new Date;t.setFullYear(t.getFullYear()-5),this.startDate=rt(t),this.endDate=rt(e),this.initialCapital=1e4,this.monthlyDeposit=500,this.rebalanceFrequency=`weekly`,this.useExistingUniverse=!0,this.pickRandom=!0,this.randomCount=10,this.symbols=``,this.reset()}createRenderRoot(){return this}disconnectedCallback(){this.status===`running`&&(this.eventSource?.close(),fetch(`/api/backtest/cancel`,{method:`POST`}).catch(()=>{})),super.disconnectedCallback()}reset(){this.eventSource?.close(),this.eventSource=void 0,this.status=`idle`,this.progress=0,this.currentDate=``,this.portfolioValue=0,this.errorMessage=``,this.phase=``,this.currentItem=``,this.itemsDone=0,this.itemsTotal=0,this.result=void 0}fieldValue(e){return e.currentTarget.value}startBacktest(e){e.preventDefault(),this.reset(),this.status=`running`;let t=new URLSearchParams({start_date:this.startDate,end_date:this.endDate,initial_capital:String(this.initialCapital),monthly_deposit:String(this.monthlyDeposit),rebalance_frequency:this.rebalanceFrequency,use_existing_universe:String(this.useExistingUniverse),pick_random:String(this.pickRandom),random_count:String(this.randomCount),symbols:this.symbols}),n=new EventSource(`/api/backtest/run?${t}`);this.eventSource=n,n.addEventListener(`progress`,e=>{let t=JSON.parse(e.data);this.progress=t.progress_pct??0,this.currentDate=t.current_date??``,this.portfolioValue=t.portfolio_value??0,this.phase=t.phase??``,this.currentItem=t.current_item??``,this.itemsDone=t.items_done??0,this.itemsTotal=t.items_total??0,t.status===`error`?(this.status=`error`,this.errorMessage=t.message||`Unknown error`,n.close()):t.status===`cancelled`&&(this.status=`idle`,n.close())}),n.addEventListener(`result`,e=>{this.result=JSON.parse(e.data),this.status=`completed`,n.close()}),n.addEventListener(`error`,()=>{n.readyState!==EventSource.CLOSED&&(this.status=`error`,this.errorMessage=`Connection lost`,n.close())})}async cancelBacktest(){this.eventSource?.close(),this.eventSource=void 0;try{await fetch(`/api/backtest/cancel`,{method:`POST`})}catch{}this.status=`idle`}renderIdle(){return j`
      <form @submit=${this.startBacktest}>
        <div>
          <label
            >Start date&nbsp;<tui-input
              type="date"
              value=${this.startDate}
              max=${this.endDate}
              required
              @change=${e=>this.startDate=this.fieldValue(e)}
            ></tui-input
          ></label>
        </div>
        <div>
          <label
            >End date&nbsp;<tui-input
              type="date"
              value=${this.endDate}
              min=${this.startDate}
              max=${rt(new Date(Date.now()-864e5))}
              required
              @change=${e=>this.endDate=this.fieldValue(e)}
            ></tui-input
          ></label>
        </div>
        <div>
          <label
            >Initial capital (EUR)&nbsp;<tui-input
              type="number"
              value=${this.initialCapital}
              min="100"
              max="10000000"
              step="1000"
              required
              @change=${e=>this.initialCapital=Number(this.fieldValue(e))}
            ></tui-input
          ></label>
          <div>Starting portfolio value in EUR</div>
        </div>
        <div>
          <label
            >Monthly deposit (EUR)&nbsp;<tui-input
              type="number"
              value=${this.monthlyDeposit}
              min="0"
              max="100000"
              step="100"
              required
              @change=${e=>this.monthlyDeposit=Number(this.fieldValue(e))}
            ></tui-input
          ></label>
          <div>Amount to add on the first of each month</div>
        </div>
        <div>
          <label
            >Rebalance frequency&nbsp;<tui-select
              value=${this.rebalanceFrequency}
              @change=${e=>this.rebalanceFrequency=this.fieldValue(e)}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly (Recommended)</option>
              <option value="monthly">Monthly</option>
            </tui-select></label
          >
        </div>
        <div aria-hidden="true">&nbsp;</div>
        <tui-box heading="Securities Selection" border="single">
          <div>
            <tui-toggle
              ?checked=${this.useExistingUniverse}
              @change=${e=>this.useExistingUniverse=e.currentTarget.checked}
              >Use existing universe</tui-toggle
            >
          </div>
          <div>Use all active securities from the current database</div>
          ${this.useExistingUniverse?``:j`
                  <div>
                    <tui-toggle
                      ?checked=${this.pickRandom}
                      @change=${e=>this.pickRandom=e.currentTarget.checked}
                      >Pick random securities</tui-toggle
                    >
                  </div>
                  ${this.pickRandom?j`<label
                          >Number of securities&nbsp;<tui-input
                            type="number"
                            value=${this.randomCount}
                            min="1"
                            max="100"
                            @change=${e=>this.randomCount=Number(this.fieldValue(e))}
                          ></tui-input
                        ></label>`:j`<label
                          >Symbols&nbsp;<tui-input
                            value=${this.symbols}
                            placeholder="AAPL.US, MSFT.US, GOOGL.US"
                            size="40"
                            @input=${e=>this.symbols=this.fieldValue(e)}
                          ></tui-input
                        ></label>`}
                `}
        </tui-box>
        <div aria-hidden="true">&nbsp;</div>
        <tui-button type="submit">Run Backtest</tui-button>
      </form>
    `}renderRunning(){return j`
      <div aria-live="polite">
        <div>${it[this.phase]??`Starting backtest…`}</div>
        <tui-progress
          aria-label="Backtest progress"
          value=${this.progress}
          columns="30"
        ></tui-progress>
        ${this.phase===`download_prices`&&this.itemsTotal>0?j`<div>
                ${this.currentItem?`Processing: ${this.currentItem} │ `:``}
                ${this.itemsDone} / ${this.itemsTotal} symbols
              </div>`:``}
        ${this.phase===`simulate`?j`<div>
                Simulating: ${this.currentDate} │
                ${Number(this.progress).toFixed(1)}%
              </div>`:``}
        ${this.portfolioValue>0&&this.phase===`simulate`?j`<div>
                Portfolio value:
                ${W(this.portfolioValue,`EUR`,0)}
              </div>`:``}
        <div aria-hidden="true">&nbsp;</div>
        <tui-button variant="error" @click=${this.cancelBacktest}
          >Cancel</tui-button
        >
      </div>
    `}renderResult(){let e=(this.result?.snapshots??[]).map(e=>e.total_value);return j`
      <div>
        Total invested ${W(this.result.total_deposits,`EUR`,0)} │
        Final value ${W(this.result.final_value,`EUR`,0)} │
        <tui-text variant=${this.result.total_return>=0?`success`:`error`}
          >Return ${W(this.result.total_return,`EUR`,0)}
          (${G(this.result.total_return_pct,2)})</tui-text
        >
      </div>
      <div>
        <tui-text variant=${this.result.cagr>=0?`success`:`error`}
          >CAGR ${G(this.result.cagr,2)}</tui-text
        >
        │
        <tui-text variant="warning"
          >Max drawdown -${K(this.result.max_drawdown,2)}%</tui-text
        >
        │ Sharpe ${K(this.result.sharpe_ratio,2)}
      </div>
      <div aria-hidden="true">&nbsp;</div>
      <tui-box heading="Equity Curve" border="single">
        ${e.length>1?j`<tui-chart
                height="6"
                aria-label="Backtest equity curve"
                .values=${e}
              ></tui-chart>`:`No equity curve data`}
      </tui-box>
      ${this.result.security_performance?.length?j`
              <div aria-hidden="true">&nbsp;</div>
              <tui-box heading="Security Performance" border="single">
                <div style="overflow: auto; min-width: 0">
                  <table style="border-collapse: collapse; width: 100%">
                    <thead>
                      <tr>
                        <th style="text-align: left">Symbol</th>
                        <th style="text-align: left">│ Invested</th>
                        <th style="text-align: left">│ Final value</th>
                        <th style="text-align: left">│ Return</th>
                        <th style="text-align: left">│ Trades</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${this.result.security_performance.map(e=>j`
                          <tr>
                            <td style="text-align: left; vertical-align: top">
                              ${e.symbol}<br />${e.name??``}
                            </td>
                            <td style="text-align: left; vertical-align: top">
                              │
                              ${W(e.total_invested,`EUR`,0)}
                            </td>
                            <td style="text-align: left; vertical-align: top">
                              │
                              ${W(e.final_value,`EUR`,0)}
                            </td>
                            <td style="text-align: left; vertical-align: top">
                              │
                              <tui-text
                                variant=${e.total_return>=0?`success`:`error`}
                                >${G(e.return_pct,2)}</tui-text
                              >
                            </td>
                            <td style="text-align: left; vertical-align: top">
                              │ ${e.num_buys} buys, ${e.num_sells}
                              sells
                            </td>
                          </tr>
                        `)}
                    </tbody>
                  </table>
                </div>
              </tui-box>
            `:``}
      <div>
        Total trades: ${this.result.trades?.length??0} │
        <tui-button @click=${this.reset}>Run Another Backtest</tui-button>
      </div>
    `}render(){return this.status===`running`?this.renderRunning():this.status===`error`?j`
        <tui-text variant="error"
          >Backtest failed: ${this.errorMessage}</tui-text
        >
        <div><tui-button @click=${this.reset}>Try Again</tui-button></div>
      `:this.status===`completed`&&this.result?this.renderResult():this.renderIdle()}};customElements.define(`sentinel-backtest`,at);var ot=`modulepreload`,st=function(e){return`/`+e},ct={},X=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e=document.getElementsByTagName(`link`),i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}function s(e){return import.meta.resolve?import.meta.resolve(e):new URL(e,import.meta.url).href}r=o(t.map(t=>{if(t=st(t,n),t=s(t),t in ct)return;ct[t]=!0;let r=t.endsWith(`.css`);for(let n=e.length-1;n>=0;n--){let i=e[n];if(i.href===t&&(!r||i.rel===`stylesheet`))return}let i=document.createElement(`link`);if(i.rel=r?`stylesheet`:ot,r||(i.as=`script`),i.crossOrigin=``,i.href=t,a&&i.setAttribute(`nonce`,a),document.head.appendChild(i),r)return new Promise((e,n)=>{i.addEventListener(`load`,e),i.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${t}`)))})}))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},lt=class extends HTMLElement{static observedAttributes=[`aria-label`,`color-scheme`,`disabled`,`document-id`,`filename`,`height`,`language`];#e=``;#t;#n;#r;#i=0;#a=0;#o=0;#s=!1;connectedCallback(){this.style.display=`block`,this.style.height=this.editorHeight,this.style.maxWidth=`100%`,this.style.minWidth=`0`,this.style.overflow=`hidden`,this.#c(),this.#l()}disconnectedCallback(){this.#i+=1,this.#a+=1,this.#o+=1,this.#t?.destroy(),this.#t=void 0,this.#n=void 0,this.#r=void 0}attributeChangedCallback(e){if(e===`height`){this.style.height=this.editorHeight;return}if(e===`disabled`){this.#_();return}if(e===`aria-label`){this.#v();return}if(e===`color-scheme`){this.#m();return}if(e===`document-id`){this.#h();return}(e===`filename`||e===`language`)&&this.#d()}get value(){return this.#e}set value(e){let t=String(e??``);t!==this.#e&&(this.#e=t,this.#r&&this.#r.value!==t&&(this.#r.value=t),this.#h())}get documentId(){return this.getAttribute(`document-id`)??``}get filename(){return this.getAttribute(`filename`)??``}get language(){return(this.getAttribute(`language`)||`plaintext`).trim().toLowerCase()}get disabled(){return this.hasAttribute(`disabled`)}get editorHeight(){return this.getAttribute(`height`)||`30lh`}get colorScheme(){let e=this.getAttribute(`color-scheme`)||`monochrome`;return[`monochrome`,`latte`,`frappe`,`macchiato`,`mocha`].includes(e)?e:`monochrome`}get editorLabel(){return this.getAttribute(`aria-label`)||`Code editor`}focus(e){this.#t?this.#t.focus():this.#r?.focus(e)}#c(){let e=document.createElement(`textarea`);e.value=this.#e,e.disabled=this.disabled,e.spellcheck=!1,e.setAttribute(`aria-label`,this.editorLabel),e.style.boxSizing=`border-box`,e.style.display=`block`,e.style.height=`100%`,e.style.width=`100%`,e.style.background=`var(--tui-background)`,e.style.color=`var(--tui-color)`,e.style.font=`inherit`,e.addEventListener(`input`,t=>{t.stopPropagation(),this.#e=e.value,this.dispatchEvent(new Event(`input`,{bubbles:!0,composed:!0}))}),this.replaceChildren(e),this.#r=e}async#l(){let e=++this.#i;try{let[{basicSetup:t,EditorView:n},{Compartment:r,EditorState:i},{markdown:a},{languages:o},{LanguageDescription:s}]=await Promise.all([X(()=>import(`./dist-DC92rvyD.js`),__vite__mapDeps([0,1,2,3])),X(()=>import(`./dist-DVVEuDXO.js`).then(e=>e.x),[]),X(()=>import(`./dist-B7fCVZHN.js`),__vite__mapDeps([4,1,2,3,5,6,7,8])),X(()=>import(`./dist-CLbigwyS.js`),__vite__mapDeps([9,2,1])),X(()=>import(`./dist-Dqw31Kj4.js`),__vite__mapDeps([2,1]))]);if(!this.isConnected||e!==this.#i)return;let c=new r,l=new r,u=new r,d=new r,f=new r,ee=this.#f(),p=this.colorScheme,te=await this.#u({LanguageDescription:s,languages:o,markdown:a}),ne=await this.#p({EditorView:n},p);if(!this.isConnected||e!==this.#i)return;let re=n.theme({"&":{height:`100%`,maxWidth:`100%`,fontSize:`inherit`},".cm-scroller":{height:`100%`,fontFamily:`var(--tui-font-family)`,lineHeight:`inherit`,overflow:`auto`},".cm-content":{padding:`0`},".cm-line":{padding:`0 1ch`},".cm-gutters":{border:`0`},".cm-activeLine, .cm-activeLineGutter":{backgroundColor:`transparent`},"&.cm-focused":{outline:`none`}}),m={EditorState:i,EditorView:n,LanguageDescription:s,languages:o,markdown:a,languageCompartment:c,colorSchemeCompartment:l,editableCompartment:u,readOnlyCompartment:d,ariaCompartment:f,languageExtension:te,languageKey:ee,colorSchemeExtension:ne,colorScheme:p,documentId:this.documentId,lastDocument:this.#e};m.buildState=e=>i.create({doc:e,extensions:[t,c.of(m.languageExtension),n.lineWrapping,f.of(n.contentAttributes.of({"aria-label":this.editorLabel})),re,l.of(m.colorSchemeExtension),u.of(n.editable.of(!this.disabled)),d.of(i.readOnly.of(this.disabled)),n.updateListener.of(e=>{if(!e.docChanged)return;let t=e.state.doc.toString();t!==m.lastDocument&&(m.lastDocument=t,this.#e=t,this.dispatchEvent(new Event(`input`,{bubbles:!0,composed:!0})))})]}),this.#n=m,this.replaceChildren(),this.#r=void 0,this.#t=new n({state:m.buildState(this.#e),parent:this}),this.#d(),this.#m()}catch(e){console.error(`Failed to load Sentinel code editor`,e)}}async#u(e=this.#n){if(!e)return[];let t=this.language;if(!t||t===`plaintext`||t===`text`)return[];if(t===`markdown`)return e.markdown({codeLanguages:e.languages});let n=e.LanguageDescription.matchLanguageName(e.languages,t,!0)||(this.filename?e.LanguageDescription.matchFilename(e.languages,this.filename):void 0);return n?(await n.load()).extension:[]}async#d(){let e=this.#n,t=this.#t;if(!e||!t)return;let n=this.#f();if(n===e.languageKey)return;let r=++this.#a,i=await this.#u(e);r===this.#a&&e===this.#n&&t===this.#t&&(e.languageExtension=i,e.languageKey=n,t.dispatch({effects:e.languageCompartment.reconfigure(i)}))}#f(){return`${this.language}\n${this.filename}`}async#p(e,t){if(t===`monochrome`)return e.EditorView.theme({"&":{backgroundColor:`var(--tui-background)`,color:`var(--tui-color)`},".cm-gutters":{backgroundColor:`var(--tui-background)`,color:`var(--tui-color)`,border:`0`},".cm-cursor, .cm-dropCursor":{borderLeftColor:`var(--tui-color)`},".cm-content *":{color:`var(--tui-color) !important`}});let{catppuccinFrappe:n,catppuccinLatte:r,catppuccinMacchiato:i,catppuccinMocha:a}=await X(async()=>{let{catppuccinFrappe:e,catppuccinLatte:t,catppuccinMacchiato:n,catppuccinMocha:r}=await import(`./dist-DigoV2kp.js`);return{catppuccinFrappe:e,catppuccinLatte:t,catppuccinMacchiato:n,catppuccinMocha:r}},__vite__mapDeps([10,2,1]));return{latte:r,frappe:n,macchiato:i,mocha:a}[t]}async#m(){let e=this.#n,t=this.#t;if(!e||!t)return;let n=this.colorScheme;if(n===e.colorScheme)return;let r=++this.#o,i=await this.#p(e,n);r===this.#o&&e===this.#n&&t===this.#t&&(e.colorSchemeExtension=i,e.colorScheme=n,t.dispatch({effects:e.colorSchemeCompartment.reconfigure(i)}))}#h(){this.#s||(this.#s=!0,queueMicrotask(()=>{this.#s=!1,this.#g()}))}#g(){let e=this.#n,t=this.#t;if(!e||!t)return;if(e.documentId!==this.documentId){e.documentId=this.documentId,e.lastDocument=this.#e,t.setState(e.buildState(this.#e));return}if(e.lastDocument===this.#e)return;e.lastDocument=this.#e;let n=Math.min(t.state.selection.main.head,this.#e.length);t.dispatch({changes:{from:0,to:t.state.doc.length,insert:this.#e},selection:{anchor:n}})}#_(){this.#r&&(this.#r.disabled=this.disabled);let e=this.#n,t=this.#t;e&&t&&t.dispatch({effects:[e.editableCompartment.reconfigure(e.EditorView.editable.of(!this.disabled)),e.readOnlyCompartment.reconfigure(e.EditorState.readOnly.of(this.disabled))]})}#v(){this.#r?.setAttribute(`aria-label`,this.editorLabel);let e=this.#n,t=this.#t;e&&t&&t.dispatch({effects:e.ariaCompartment.reconfigure(e.EditorView.contentAttributes.of({"aria-label":this.editorLabel}))})}};customElements.define(`sentinel-code-editor`,lt);var ut=`sentinel.codeEditorColorScheme`,dt=new Set([`monochrome`,`latte`,`frappe`,`macchiato`,`mocha`]),Z=`0 9 * * *`,ft=43200,pt=[{label:`Minute`,options:[[`*`,`every minute`],...[0,5,10,15,20,30,45].map(e=>[String(e),`:${String(e).padStart(2,`0`)}`])]},{label:`Hour`,options:[[`*`,`every hour`],...Array.from({length:24},(e,t)=>[String(t),t===0?`midnight`:t===12?`noon`:`${t>12?t-12:t} ${t<12?`AM`:`PM`}`])]},{label:`Day`,options:[[`*`,`every day`],...Array.from({length:31},(e,t)=>[String(t+1),String(t+1)])]},{label:`Month`,options:[[`*`,`every month`],...[`January`,`February`,`March`,`April`,`May`,`June`,`July`,`August`,`September`,`October`,`November`,`December`].map((e,t)=>[String(t+1),e])]},{label:`Weekday`,options:[[`*`,`every day`],...[`Sunday`,`Monday`,`Tuesday`,`Wednesday`,`Thursday`,`Friday`,`Saturday`].map((e,t)=>[String(t),e])]}].map((e,t)=>({...e,index:t}));function mt(e){let t={};try{t=JSON.parse(e)}catch{}return{name:typeof t.name==`string`?t.name:``,enabled:t.enabled===!0,description:typeof t.description==`string`?t.description:``,tags:Array.isArray(t.tags)?t.tags.filter(e=>typeof e==`string`):[],cwd:typeof t.cwd==`string`?t.cwd:``,timeout:typeof t.timeout==`number`?t.timeout:``,schedule:typeof t.schedule==`string`&&t.schedule.trim()?t.schedule:null,schedulePolicy:t.schedulePolicy&&typeof t.schedulePolicy==`object`?t.schedulePolicy:null}}var ht=class extends R{static properties={tasks:{state:!0},selectedId:{state:!0},task:{state:!0},files:{state:!0},activeFile:{state:!0},drafts:{state:!0},baselines:{state:!0},metadata:{state:!0},metadataBaseline:{state:!0},tab:{state:!0},runInputs:{state:!0},runs:{state:!0},runId:{state:!0},run:{state:!0},loading:{state:!0},busyAction:{state:!0},notice:{state:!0},actionError:{state:!0},editorColorScheme:{state:!0}};constructor(){super(),this.tasks=[],this.selectedId=void 0,this.task=void 0,this.files=[],this.activeFile=void 0,this.drafts={},this.baselines={},this.metadata=void 0,this.metadataBaseline=``,this.tab=`files`,this.runInputs=`{}`,this.runs=[],this.runId=void 0,this.run=void 0,this.loading=!0,this.busyAction=``,this.notice=``,this.actionError=``;let e=globalThis.localStorage?.getItem(ut);this.editorColorScheme=dt.has(e)?e:`monochrome`}createRenderRoot(){return this}connectedCallback(){super.connectedCallback(),this.loadTasks(),this.tasksTimer=setInterval(()=>this.loadTasks(!0),2e4),this.runsTimer=setInterval(()=>this.pollRuns(),2e3)}disconnectedCallback(){clearInterval(this.tasksTimer),clearInterval(this.runsTimer),super.disconnectedCallback()}get filesDirty(){return this.files.some(e=>e.name in this.baselines&&this.drafts[e.name]!==this.baselines[e.name])}get metadataDirty(){return this.metadata!==void 0&&JSON.stringify(this.metadata)!==this.metadataBaseline}get dirty(){return this.filesDirty||this.metadataDirty}get running(){return[`queued`,`running`].includes(this.run?.status)}confirmClose(){return!this.dirty||window.confirm(`Discard unsaved changes to "${this.task?.name||this.selectedId}"?`)}async loadTasks(e=!1){e||(this.loading=!0);try{let e=await z(`/api/tasks`);this.tasks=e,(!this.selectedId||!e.some(e=>e.id===this.selectedId))&&e[0]&&await this.selectTask(e[0].id,{force:!0})}catch(e){this.actionError=e.message}finally{e||(this.loading=!1)}}async selectTask(e,{force:t=!1}={}){if(!(e===this.selectedId&&this.task)&&(t||this.confirmClose())){this.selectedId=e,this.task=void 0,this.files=[],this.activeFile=void 0,this.drafts={},this.baselines={},this.metadata=void 0,this.metadataBaseline=``,this.runs=[],this.runId=void 0,this.run=void 0,this.runInputs=`{}`,this.notice=``,this.actionError=``,this.loading=!0;try{let[t,n,r,i]=await Promise.all([z(`/api/tasks/${encodeURIComponent(e)}`),z(`/api/tasks/${encodeURIComponent(e)}/files`),z(`/api/tasks/${encodeURIComponent(e)}/runs?limit=50`),z(`/api/tasks/${encodeURIComponent(e)}/files/task.json`)]);if(this.selectedId!==e)return;this.task=t,this.files=n,this.runs=r,this.metadata=mt(i.content),this.metadataBaseline=JSON.stringify(this.metadata);let a=n.find(e=>e.name===`task.js`)?.name??n[0]?.name;a&&await this.selectFile(a);let o=r.find(e=>[`queued`,`running`].includes(e.status));this.runId=o?.id??r[0]?.id,this.runId&&await this.loadRun(this.runId)}catch(e){this.actionError=e.message}finally{this.selectedId===e&&(this.loading=!1)}}}async selectFile(e){if(this.activeFile=e,!(e in this.drafts))try{let t=await z(`/api/tasks/${encodeURIComponent(this.selectedId)}/files/${encodeURIComponent(e)}`);this.drafts={...this.drafts,[e]:t.content},this.baselines={...this.baselines,[e]:t.content}}catch(e){this.actionError=e.message}}async pollRuns(){if(this.selectedId)try{let e=await z(`/api/tasks/${encodeURIComponent(this.selectedId)}/runs?limit=50`);this.runs=e;let t=e.find(e=>[`queued`,`running`].includes(e.status));t?this.runId=t.id:this.runId&&!e.some(e=>e.id===this.runId)&&(this.runId=e[0]?.id),this.runId&&await this.loadRun(this.runId)}catch(e){this.actionError=e.message}}async loadRun(e){this.runId=e;try{this.run=await z(`/api/task-runs/${encodeURIComponent(e)}`)}catch(e){this.actionError=e.message}}async createTask(){this.busyAction=`new`,this.actionError=``;try{let e=await V(`/api/tasks`,{name:`New Task`});await this.loadTasks(!0),await this.selectTask(e.id,{force:!0})}catch(e){this.actionError=e.message}finally{this.busyAction=``}}async deleteTask(){if(this.task&&window.confirm(`Delete task "${this.task.name}"?`)){this.busyAction=`delete-task`;try{await H(`/api/tasks/${encodeURIComponent(this.task.id)}`),this.selectedId=void 0,this.task=void 0,this.notice=`Deleted`,await this.loadTasks()}catch(e){this.actionError=e.message}finally{this.busyAction=``}}}async validateTask(){this.busyAction=`validate`,this.notice=``,this.actionError=``;try{let e=await z(`/api/tasks/${encodeURIComponent(this.selectedId)}/validate`);this.notice=e.ok?`Validation passed`:(e.errors??[]).join(`
`)}catch(e){this.actionError=e.message}finally{this.busyAction=``}}async startRun(){let e;try{if(e=JSON.parse(this.runInputs),!e||Array.isArray(e)||typeof e!=`object`)throw Error(`Inputs must be a JSON object`)}catch(e){this.actionError=`Invalid inputs: ${e.message}`;return}this.busyAction=`run`,this.notice=``,this.actionError=``;try{let t=await V(`/api/tasks/${encodeURIComponent(this.selectedId)}/run`,{inputs:e});this.runId=t.id,this.run=t,await this.pollRuns()}catch(e){this.actionError=e.message}finally{this.busyAction=``}}async stopRun(){if(this.runId){this.busyAction=`stop`;try{await H(`/api/task-runs/${encodeURIComponent(this.runId)}`),await this.pollRuns()}catch(e){this.actionError=e.message}finally{this.busyAction=``}}}updateDraft(e){this.drafts={...this.drafts,[this.activeFile]:e}}async saveFile(){if(this.activeFile){this.busyAction=`save-file`;try{let e=this.drafts[this.activeFile]??``;await B(`/api/tasks/${encodeURIComponent(this.selectedId)}/files/${encodeURIComponent(this.activeFile)}`,{content:e}),this.baselines={...this.baselines,[this.activeFile]:e},this.notice=`Saved`,this.activeFile===`task.json`&&await this.loadTasks(!0)}catch(e){this.actionError=e.message}finally{this.busyAction=``}}}setEditorColorScheme(e){this.editorColorScheme=dt.has(e)?e:`monochrome`,globalThis.localStorage?.setItem(ut,this.editorColorScheme)}async createFile(){let e=window.prompt(`New file name (e.g. step.sh, prompt.md)`)?.trim();if(e)try{await V(`/api/tasks/${encodeURIComponent(this.selectedId)}/files`,{name:e,content:``}),this.files=await z(`/api/tasks/${encodeURIComponent(this.selectedId)}/files`),this.drafts={...this.drafts,[e]:``},this.baselines={...this.baselines,[e]:``},this.activeFile=e,this.notice=`Created`}catch(e){this.actionError=e.message}}async deleteFile(e){if(window.confirm(`Delete "${e.name}"? This cannot be undone.`))try{await H(`/api/tasks/${encodeURIComponent(this.selectedId)}/files/${encodeURIComponent(e.name)}`);let t={...this.drafts},n={...this.baselines};delete t[e.name],delete n[e.name],this.drafts=t,this.baselines=n,this.files=this.files.filter(t=>t.name!==e.name),this.activeFile===e.name&&(this.activeFile=void 0,this.files[0]&&await this.selectFile(this.files[0].name)),this.notice=`Deleted`}catch(e){this.actionError=e.message}}patchMetadata(e){this.metadata={...this.metadata,...e}}get scheduleMode(){return this.metadata?.schedule?`cron`:(this.metadata?.schedulePolicy?.staleAfterSeconds??0)>0?`interval`:`off`}setScheduleMode(e){e===`cron`?this.patchMetadata({schedule:this.metadata.schedule||Z,schedulePolicy:null}):e===`interval`?this.patchMetadata({schedule:null,schedulePolicy:{...this.metadata.schedulePolicy??{},staleAfterSeconds:this.metadata.schedulePolicy?.staleAfterSeconds??ft,runWhen:this.metadata.schedulePolicy?.runWhen??`idle`}}):this.patchMetadata({schedule:null,schedulePolicy:null})}intervalParts(){let e=this.metadata?.schedulePolicy?.staleAfterSeconds??ft;return{days:Math.floor(e/86400),hours:Math.floor(e%86400/3600),minutes:Math.floor(e%3600/60)}}patchInterval(e,t){let n={...this.intervalParts(),[e]:Math.max(0,Number(t))},r=Math.max(1,Math.floor(n.days*86400+n.hours*3600+n.minutes*60));this.patchMetadata({schedulePolicy:{...this.metadata.schedulePolicy,staleAfterSeconds:r,runWhen:this.metadata.schedulePolicy?.runWhen??`idle`}})}patchSchedulePolicy(e){this.patchMetadata({schedulePolicy:{...this.metadata.schedulePolicy,...e}})}cronParts(){let e=(this.metadata?.schedule?.trim()||Z).split(/\s+/);return e.length===5?e:Z.split(` `)}cronValues(e){let t=this.cronParts()[e];return new Set(t===`*`?[`*`]:t.split(`,`).filter(Boolean))}toggleCronValue(e,t,n){let r=this.cronValues(e);t===`*`?(r.clear(),r.add(`*`)):n?(r.delete(`*`),r.add(t)):(r.delete(t),r.size===0&&r.add(`*`));let i=this.cronParts();i[e]=r.has(`*`)?`*`:[...r].sort((e,t)=>Number(e)-Number(t)).join(`,`),this.patchMetadata({schedule:i.join(` `),schedulePolicy:null})}async saveMetadata(){this.busyAction=`save-metadata`;try{let e={name:this.metadata.name.trim()||`Untitled task`,enabled:this.metadata.enabled,description:this.metadata.description.trim()||null,tags:this.metadata.tags.length?this.metadata.tags:null,cwd:this.metadata.cwd.trim()||null,timeout:Number(this.metadata.timeout)>0?Number(this.metadata.timeout):null,schedule:this.metadata.schedule?.trim()||null,schedulePolicy:this.metadata.schedulePolicy||null},t=await B(`/api/tasks/${encodeURIComponent(this.selectedId)}/meta`,e);this.task=t,this.metadataBaseline=JSON.stringify(this.metadata),this.notice=`Saved`,await this.loadTasks(!0)}catch(e){this.actionError=e.message}finally{this.busyAction=``}}renderTaskList(){return j`
      <tui-box heading="Tasks" border="single">
        ${[[`Invalid`,this.tasks.filter(e=>e.invalid)],[`Enabled`,this.tasks.filter(e=>e.enabled&&!e.invalid)],[`Disabled`,this.tasks.filter(e=>!e.enabled&&!e.invalid)]].filter(([,e])=>e.length>0).map(([e,t],n)=>j`
            ${n>0?j`<div aria-hidden="true">&nbsp;</div>`:``}
            <div>${e}</div>
            ${t.map(e=>j`
                <div>
                  <span aria-hidden="true"
                    >${e.id===this.selectedId?`▶`:` `}&nbsp;</span
                  ><tui-button
                    ?disabled=${this.running}
                    @click=${()=>this.selectTask(e.id)}
                    >${e.name}</tui-button
                  >
                  <tui-text
                    variant=${e.invalid?`error`:e.enabled?`success`:``}
                    >${e.invalid?`invalid`:e.enabled?`on`:`off`}</tui-text
                  >
                  <div>${e.id}</div>
                </div>
              `)}
          `)}
      </tui-box>
    `}renderToolbar(){return j`
      <tui-flex align="baseline" justify="between" wrap>
        <span>
          ${this.task.name}
          ${this.dirty?j`<tui-text variant="warning">unsaved</tui-text>`:``}
          │ ${this.task.source} │ ${this.task.id}
        </span>
        <span>
          <tui-button
            ?disabled=${this.dirty||this.running||this.busyAction!==``}
            @click=${this.validateTask}
            >Check</tui-button
          >
          ${this.running?j`<tui-button variant="error" @click=${this.stopRun}
                  >Stop</tui-button
                >`:j`<tui-button
                  ?disabled=${this.dirty||this.task.invalid||this.busyAction!==``}
                  @click=${this.startRun}
                  >Run</tui-button
                >`}
          <tui-button
            variant="error"
            ?disabled=${this.running||this.task.source===`core`||this.busyAction!==``}
            @click=${this.deleteTask}
            >Delete</tui-button
          >
        </span>
      </tui-flex>
    `}renderFiles(){let e=this.files.find(e=>e.name===this.activeFile),t=this.activeFile?this.drafts[this.activeFile]??``:``,n=this.activeFile&&this.activeFile in this.baselines&&t!==this.baselines[this.activeFile];return j`
      <tui-flex align="start" wrap>
        <tui-box
          heading="Files"
          border="single"
          style="flex: 1 1 20ch; min-width: 0"
        >
          <div><tui-button @click=${this.createFile}>New File</tui-button></div>
          ${this.files.map(e=>j`
              <div>
                <span aria-hidden="true"
                  >${e.name===this.activeFile?`▶`:` `}&nbsp;</span
                ><tui-button
                  ?disabled=${this.running}
                  @click=${()=>this.selectFile(e.name)}
                  >${e.name}</tui-button
                >
                ${this.drafts[e.name]!==this.baselines[e.name]&&e.name in this.baselines?j`<tui-text variant="warning">unsaved</tui-text>`:``}
                ${e.protected?`protected`:``}
                ${e.protected?``:j`<tui-button
                        variant="error"
                        ?disabled=${this.running}
                        @click=${()=>this.deleteFile(e)}
                        >Delete</tui-button
                      >`}
              </div>
            `)}
        </tui-box>
        <section style="flex: 4 1 60ch; min-width: 0">
          <div>
            ${this.activeFile??`No file selected`}
            ${e?.protected?`│ protected`:``}
            ${n?j`│ <tui-text variant="warning">unsaved</tui-text>`:``}
            <label
              >Scheme&nbsp;<tui-select
                aria-label="Code editor color scheme"
                value=${this.editorColorScheme}
                @change=${e=>this.setEditorColorScheme(e.currentTarget.value)}
              >
                <option value="monochrome">Monochrome</option>
                <option value="latte">Latte</option>
                <option value="frappe">Frappé</option>
                <option value="macchiato">Macchiato</option>
                <option value="mocha">Mocha</option>
              </tui-select></label
            >
            <tui-button
              ?disabled=${!n||this.running||this.busyAction!==``}
              @click=${this.saveFile}
              >Save</tui-button
            >
          </div>
          <sentinel-code-editor
            aria-label="${this.activeFile??`Task file`} content"
            document-id="${this.selectedId??``}/${this.activeFile??``}"
            filename=${this.activeFile??`file.txt`}
            language=${e?.language??`plaintext`}
            color-scheme=${this.editorColorScheme}
            .value=${t}
            ?disabled=${!this.activeFile||this.running}
            @input=${e=>this.updateDraft(e.currentTarget.value)}
          ></sentinel-code-editor>
        </section>
      </tui-flex>
    `}renderSchedule(){let e=this.intervalParts();return j`
      <div>Schedule</div>
      <tui-radio-buttonset
        aria-label="Task schedule mode"
        value=${this.scheduleMode}
        ?disabled=${this.running}
        @change=${e=>this.setScheduleMode(e.currentTarget.value)}
      >
        <tui-radio-button value="off">Off</tui-radio-button>
        <tui-radio-button value="cron">Cron</tui-radio-button>
        <tui-radio-button value="interval">Interval</tui-radio-button>
      </tui-radio-buttonset>
      ${this.scheduleMode===`cron`?j`
              <div>
                <label
                  >Cron&nbsp;<tui-input
                    value=${this.metadata.schedule??Z}
                    size="24"
                    ?disabled=${this.running}
                    @input=${e=>this.patchMetadata({schedule:e.currentTarget.value||Z})}
                  ></tui-input
                ></label>
              </div>
              ${pt.map(e=>{let t=this.cronValues(e.index);return j`
                  <div>${e.label}</div>
                  <tui-flex align="baseline" wrap>
                    ${e.options.map(([n,r])=>j`
                        <tui-toggle
                          ?checked=${t.has(n)}
                          ?disabled=${this.running}
                          @change=${t=>this.toggleCronValue(e.index,n,t.currentTarget.checked)}
                          >${n} ${r}</tui-toggle
                        ><span aria-hidden="true">&nbsp;</span>
                      `)}
                  </tui-flex>
                `})}
            `:``}
      ${this.scheduleMode===`interval`?j`
              <tui-flex align="baseline" wrap>
                <label
                  >Days&nbsp;<tui-input
                    type="number"
                    min="0"
                    value=${e.days}
                    @change=${e=>this.patchInterval(`days`,e.currentTarget.value)}
                  ></tui-input
                ></label>
                <span aria-hidden="true">&nbsp;│&nbsp;</span>
                <label
                  >Hours&nbsp;<tui-input
                    type="number"
                    min="0"
                    max="23"
                    value=${e.hours}
                    @change=${e=>this.patchInterval(`hours`,e.currentTarget.value)}
                  ></tui-input
                ></label>
                <span aria-hidden="true">&nbsp;│&nbsp;</span>
                <label
                  >Minutes&nbsp;<tui-input
                    type="number"
                    min="0"
                    max="59"
                    value=${e.minutes}
                    @change=${e=>this.patchInterval(`minutes`,e.currentTarget.value)}
                  ></tui-input
                ></label>
                <span aria-hidden="true">&nbsp;│&nbsp;</span>
                <label
                  >Run when&nbsp;<tui-select
                    value=${this.metadata.schedulePolicy?.runWhen??`idle`}
                    @change=${e=>this.patchSchedulePolicy({runWhen:e.currentTarget.value})}
                  >
                    <option value="idle">Idle</option>
                    <option value="immediate">Immediate</option>
                  </tui-select></label
                >
                <span aria-hidden="true">&nbsp;│&nbsp;</span>
                <label
                  >Priority&nbsp;<tui-input
                    type="number"
                    min="-1000"
                    max="1000"
                    value=${this.metadata.schedulePolicy?.priority??0}
                    @change=${e=>this.patchSchedulePolicy({priority:Number(e.currentTarget.value)})}
                  ></tui-input
                ></label>
              </tui-flex>
            `:``}
    `}renderMetadata(){return this.metadata?j`
      <tui-flex align="baseline" justify="between" wrap>
        <span>Metadata</span>
        <tui-button
          ?disabled=${!this.metadataDirty||this.running||this.busyAction!==``}
          @click=${this.saveMetadata}
          >Save</tui-button
        >
      </tui-flex>
      <div>
        <label
          ><span>Name</span>
          <tui-input
            block
            value=${this.metadata.name}
            @input=${e=>this.patchMetadata({name:e.currentTarget.value})}
          ></tui-input
        ></label>
        <tui-toggle
          ?checked=${this.metadata.enabled}
          ?disabled=${this.running}
          @change=${e=>this.patchMetadata({enabled:e.currentTarget.checked})}
          >Enabled</tui-toggle
        >
      </div>
      <div>
        <label>Description</label>
        <tui-textarea
          aria-label="Task description"
          block
          rows="4"
          value=${this.metadata.description}
          ?disabled=${this.running}
          @input=${e=>this.patchMetadata({description:e.currentTarget.value})}
        ></tui-textarea>
      </div>
      <div>
        <label
          ><span>Tags</span>
          <tui-input
            block
            value=${this.metadata.tags.join(`, `)}
            ?disabled=${this.running}
            @input=${e=>this.patchMetadata({tags:e.currentTarget.value.split(`,`).map(e=>e.trim()).filter(Boolean)})}
          ></tui-input
        ></label>
      </div>
      <div>
        <label
          >Timeout (seconds)&nbsp;<tui-input
            type="number"
            min="0"
            step="60"
            value=${this.metadata.timeout}
            ?disabled=${this.running}
            @change=${e=>this.patchMetadata({timeout:Number(e.currentTarget.value)})}
          ></tui-input
        ></label>
      </div>
      <div>
        <label
          ><span>Working directory</span>
          <tui-input
            block
            value=${this.metadata.cwd}
            placeholder="@/tasks/artifacts/{{task-id}}"
            ?disabled=${this.running}
            @input=${e=>this.patchMetadata({cwd:e.currentTarget.value})}
          ></tui-input
        ></label>
      </div>
      <div aria-hidden="true">&nbsp;</div>
      ${this.renderSchedule()}
    `:j`<div>Loading metadata…</div>`}renderRun(){return j`
      <tui-box heading="Run" border="single">
        <div>
          Status
          <tui-text variant=${Y(this.run?.status)||``}
            >${this.run?.status??`idle`}</tui-text
          >
        </div>
        <div>History</div>
        ${this.runs.length?this.runs.map(e=>j`
                  <div>
                    <span aria-hidden="true"
                      >${e.id===this.runId?`▶`:` `}&nbsp;</span
                    ><tui-button @click=${()=>this.loadRun(e.id)}
                      >${e.status} -
                      ${e.createdAt?nt(e.createdAt):e.id}</tui-button
                    >
                  </div>
                `):`No runs`}
        <div>Inputs (JSON)</div>
        <tui-textarea
          aria-label="Task run inputs"
          block
          rows="4"
          value=${this.runInputs}
          ?disabled=${this.running}
          @input=${e=>this.runInputs=e.currentTarget.value}
        ></tui-textarea>
        <div>Log</div>
        ${(this.run?.log??[]).map(e=>j`<div><code>${e}</code></div>`)}
        ${this.run?.error?j`<tui-text variant="error">${this.run.error}</tui-text>`:``}
        <pre style="white-space: pre-wrap; overflow-wrap: anywhere">
${this.run?.liveOutput??` `}</pre>
      </tui-box>
    `}renderWorkbench(){return this.loading&&!this.task?j`<div>Loading task…</div>`:this.task?j`
      ${this.renderToolbar()}
      ${this.notice?j`<div aria-live="polite">${this.notice}</div>`:``}
      ${this.actionError?j`<tui-text variant="error">${this.actionError}</tui-text>`:``}
      <div aria-hidden="true">&nbsp;</div>
      <tui-flex align="start" wrap>
        <section style="flex: 3 1 60ch; min-width: 0">
          <tui-radio-buttonset
            aria-label="Task editor view"
            value=${this.tab}
            @change=${e=>this.tab=e.currentTarget.value}
          >
            <tui-radio-button value="files">Files</tui-radio-button>
            <tui-radio-button value="metadata">Metadata</tui-radio-button>
          </tui-radio-buttonset>
          ${this.tab===`metadata`?this.renderMetadata():this.renderFiles()}
        </section>
        <aside style="flex: 1 1 32ch; min-width: 0">${this.renderRun()}</aside>
      </tui-flex>
    `:j`<div>No task selected</div>`}render(){return j`
      <tui-flex align="baseline" justify="between" wrap>
        <span>${this.tasks.length} core and user task definitions</span>
        <span>
          <tui-button
            ?disabled=${this.busyAction!==``}
            @click=${this.createTask}
            >New</tui-button
          >
          <tui-button @click=${()=>this.loadTasks()}>Refresh</tui-button>
        </span>
      </tui-flex>
      <div aria-hidden="true">&nbsp;</div>
      ${this.loading&&this.tasks.length===0?j`<div>Loading tasks…</div>`:j`
              <tui-flex align="start" wrap>
                <aside style="flex: 1 1 24ch; min-width: 0">
                  ${this.renderTaskList()}
                </aside>
                <section style="flex: 4 1 70ch; min-width: 0">
                  ${this.renderWorkbench()}
                </section>
              </tui-flex>
            `}
    `}};customElements.define(`sentinel-tasks`,ht);var gt=class extends R{static properties={tab:{state:!0},kind:{state:!0},staleOnly:{state:!0},ratingSymbol:{state:!0},busy:{state:!0},notice:{state:!0},actionError:{state:!0},artifactUnit:{state:!0},activeArtifact:{state:!0},artifactContent:{state:!0},artifactLoading:{state:!0},artifactError:{state:!0}};constructor(){super(),this.tab=`status`,this.kind=``,this.staleOnly=!1,this.ratingSymbol=``,this.busy=!1,this.notice=``,this.actionError=``,this.artifactUnit=void 0,this.activeArtifact=``,this.artifactContent=``,this.artifactLoading=!1,this.artifactError=``}status=new U(this,e=>z(`/api/ai/status`,{signal:e}),{interval:3e3});units=new U(this,e=>z(this.unitsPath,{signal:e}),{interval:1e4});allUnits=new U(this,e=>z(`/api/ai/units`,{signal:e}),{interval:1e4});history=new U(this,e=>z(`/api/ai/history?limit=100`,{signal:e}),{interval:1e4});createRenderRoot(){return this}get unitsPath(){let e=new URLSearchParams;this.kind&&e.set(`kind`,this.kind),this.staleOnly&&e.set(`stale_only`,`true`);let t=e.toString();return`/api/ai/units${t?`?${t}`:``}`}changeUnitsFilter(e,t){this[e]=t,this.units.refresh()}changeTab(e){let t=e.currentTarget.value;if(this.tab===`tasks`&&t!==`tasks`){let t=this.querySelector(`sentinel-tasks`);if(t?.confirmClose&&!t.confirmClose()){e.currentTarget.value=`tasks`;return}}this.tab=t}async refreshAll(){await Promise.all([this.status.refresh(),this.units.refresh(),this.allUnits.refresh(),this.history.refresh()])}async requestResearch(e,t,n){this.busy=!0,this.notice=``,this.actionError=``;try{await V(`/api/ai/requests`,{kind:e,unit_kind:t,unit_key:n}),this.notice=`${e===`rate`?`Rating`:`Analysis`} queued for ${n}`,await this.refreshAll()}catch(e){this.actionError=e.message}finally{this.busy=!1}}async openArtifacts(e){this.artifactUnit=e,this.activeArtifact=e.artifacts?.[0]??``,this.artifactContent=``,this.artifactError=``,this.activeArtifact&&await this.loadArtifact()}closeArtifacts(){this.artifactUnit=void 0,this.activeArtifact=``,this.artifactContent=``}async changeArtifact(e){this.activeArtifact=e,await this.loadArtifact()}async loadArtifact(){let e=this.artifactUnit,t=this.activeArtifact;if(e&&t){this.artifactLoading=!0,this.artifactError=``;try{let n=(await z(`/api/ai/artifacts/${encodeURIComponent(e.kind)}/${encodeURIComponent(e.key)}/${encodeURIComponent(t)}`)).content??``;if(t.endsWith(`.json`))try{n=JSON.stringify(JSON.parse(n),null,2)}catch{}this.artifactContent=n}catch(e){this.artifactError=e.message}finally{this.artifactLoading=!1}}}renderStatus(){let e=this.status.value,t=e.staleness?.security??{stale:0,total:0},n=e.staleness?.macro??{stale:0,total:0},r=(this.allUnits.value?.units??[]).filter(e=>e.kind===`security`);return j`
      <div>
        Securities ${t.stale}/${t.total} stale │ Macro
        ${n.stale}/${n.total} stale │ Queued
        ${e.queued?.length??0} │ Memory ${e.memory?.findings??`-`}
        findings
      </div>
      <div aria-hidden="true">&nbsp;</div>
      <tui-box heading="Current Work" border="single">
        ${e.running?j`
                <div>${e.running.label}</div>
                <div>${e.running.kind}:${e.running.key}</div>
                ${e.running.elapsed_seconds===void 0?``:j`<div>
                        ${J(e.running.elapsed_seconds*1e3)}
                      </div>`}
              `:`Idle`}
      </tui-box>
      <div aria-hidden="true">&nbsp;</div>
      <tui-flex align="start" wrap>
        <tui-box
          heading="Next in Line"
          border="single"
          style="flex: 1 1 40ch; min-width: 0"
        >
          ${e.queued?.length?e.queued.map(e=>j`
                    <div>
                      ${e.unit_label??`${e.unit_kind}:${e.unit_key}`}
                      │ ${e.task_name??e.task_id??e.kind}
                    </div>
                  `):`Queue empty`}
        </tui-box>
        <tui-box
          heading="Latest Tick"
          border="single"
          style="flex: 1 1 40ch; min-width: 0"
        >
          ${e.last_run?j`
                  <div>
                    <tui-text
                      variant=${Y(e.last_run.status)||``}
                      >${e.last_run.status}</tui-text
                    >
                    │ ${q(e.last_run.finished_at)}
                  </div>
                  ${e.last_run.unit_label?j`<div>
                          ${e.last_run.unit_label}
                          ${e.last_run.unit_key?`(${e.last_run.unit_key})`:``}
                        </div>`:``}
                  ${e.last_run.duration_seconds===void 0?``:j`<div>
                          ${J(e.last_run.duration_seconds*1e3)}
                        </div>`}
                  ${e.last_run.error?j`<tui-text variant="error"
                          >${e.last_run.error}</tui-text
                        >`:``}
                `:`No runs yet`}
        </tui-box>
      </tui-flex>
      ${e.staleness?.most_stale?j`<div>
              Oldest: ${e.staleness.most_stale.label}
              (${e.staleness.most_stale.kind})
            </div>`:``}
      ${e.memory?.error?j`<tui-text variant="error"
              >Memory: ${e.memory.error}</tui-text
            >`:``}
      <div aria-hidden="true">&nbsp;</div>
      <tui-box heading="Manual Rating" border="single">
        <tui-flex align="baseline" wrap>
          <label
            >Security&nbsp;<tui-select
              value=${this.ratingSymbol}
              @change=${e=>this.ratingSymbol=e.currentTarget.value}
            >
              <option value="">Select a security</option>
              ${r.map(e=>j`<option value=${e.key}>
                    ${e.label} (${e.key})
                  </option>`)}
            </tui-select></label
          >
          <span aria-hidden="true">&nbsp;</span>
          <tui-button
            ?disabled=${!this.ratingSymbol||this.busy}
            @click=${()=>this.requestResearch(`rate`,`security`,this.ratingSymbol)}
            >Rate now</tui-button
          >
        </tui-flex>
      </tui-box>
    `}renderUnits(){let e=this.units.value?.units??[];return j`
      <tui-flex align="baseline" wrap>
        <label
          >Kind&nbsp;<tui-select
            value=${this.kind}
            @change=${e=>this.changeUnitsFilter(`kind`,e.currentTarget.value)}
          >
            <option value="">All units</option>
            <option value="security">Securities</option>
            <option value="macro">Macro</option>
            <option value="portfolio">Portfolio</option>
          </tui-select></label
        >
        <span aria-hidden="true">&nbsp;│&nbsp;</span>
        <tui-toggle
          ?checked=${this.staleOnly}
          @change=${e=>this.changeUnitsFilter(`staleOnly`,e.currentTarget.checked)}
          >Stale only</tui-toggle
        >
        <span aria-hidden="true">&nbsp;│&nbsp;</span>
        <tui-button @click=${this.refreshAll}>Refresh</tui-button>
      </tui-flex>
      <div aria-hidden="true">&nbsp;</div>
      ${this.units.loading&&!this.units.value?`Loading units…`:e.length===0?`No research units match this view.`:j`
                <div style="overflow: auto; min-width: 0">
                  <table style="border-collapse: collapse; width: 100%">
                    <thead>
                      <tr>
                        <th style="text-align: left">Unit</th>
                        <th style="text-align: left">│ Kind</th>
                        <th style="text-align: left">│ Last analyzed</th>
                        <th style="text-align: left">│ State</th>
                        <th style="text-align: left">│ Error</th>
                        <th style="text-align: left">│ Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${e.map(e=>{let t=e.status===`running`?`running`:e.stale?`stale`:`fresh`;return j`
                          <tr>
                            <td style="text-align: left; vertical-align: top">
                              ${e.label}<br />${e.key}
                            </td>
                            <td style="text-align: left; vertical-align: top">
                              │ ${e.kind}
                            </td>
                            <td style="text-align: left; vertical-align: top">
                              │
                              ${e.last_analyzed_at?q(e.last_analyzed_at):`Never`}
                            </td>
                            <td style="text-align: left; vertical-align: top">
                              │
                              <tui-text variant=${Y(t)||``}
                                >${t}</tui-text
                              >
                            </td>
                            <td
                              style="text-align: left; vertical-align: top; max-width: 40ch; overflow-wrap: anywhere"
                            >
                              │ ${e.last_error??`-`}
                            </td>
                            <td
                              style="text-align: left; vertical-align: top; white-space: nowrap"
                            >
                              │
                              ${e.kind===`portfolio`?``:j`<tui-button
                                      ?disabled=${this.busy||e.status===`running`}
                                      @click=${()=>this.requestResearch(`analyze`,e.kind,e.key)}
                                      >Analyze</tui-button
                                    >`}
                              <tui-button
                                ?disabled=${!e.artifacts?.length}
                                @click=${()=>this.openArtifacts(e)}
                                >View</tui-button
                              >
                            </td>
                          </tr>
                        `})}
                    </tbody>
                  </table>
                </div>
              `}
    `}renderHistory(){let e=this.history.value?.history??[];return this.history.loading&&!this.history.value?j`<div>Loading pipeline history…</div>`:e.length===0?j`<div>No pipeline runs yet.</div>`:j`
      <div style="overflow: auto; min-width: 0">
        <table style="border-collapse: collapse; width: 100%">
          <thead>
            <tr>
              <th style="text-align: left">Unit</th>
              <th style="text-align: left">│ Status</th>
              <th style="text-align: left">│ Duration</th>
              <th style="text-align: left">│ Finished</th>
              <th style="text-align: left">│ Error</th>
            </tr>
          </thead>
          <tbody>
            ${e.map(e=>j`
                <tr>
                  <td style="text-align: left; vertical-align: top">
                    ${e.unit_label??e.unit_key??e.job_id?.replace(`ai:tick:`,``)??`-`}
                  </td>
                  <td style="text-align: left; vertical-align: top">
                    │
                    <tui-text variant=${Y(e.status)||``}
                      >${e.status}</tui-text
                    >
                  </td>
                  <td style="text-align: left; vertical-align: top">
                    │ ${J(e.duration_ms)}
                  </td>
                  <td style="text-align: left; vertical-align: top">
                    │
                    ${q(typeof e.executed_at==`number`?e.executed_at*1e3:e.executed_at)}
                  </td>
                  <td
                    style="text-align: left; vertical-align: top; overflow-wrap: anywhere"
                  >
                    │ ${e.error??`-`}
                  </td>
                </tr>
              `)}
          </tbody>
        </table>
      </div>
    `}renderArtifactModal(){let e=this.artifactUnit;return e?j`
      <tui-modal
        heading="${e.label} / artifacts"
        open
        @close=${this.closeArtifacts}
      >
        ${e.artifacts?.length?j`
                <label
                  >Artifact&nbsp;<tui-select
                    value=${this.activeArtifact}
                    @change=${e=>this.changeArtifact(e.currentTarget.value)}
                  >
                    ${e.artifacts.map(e=>j`<option value=${e}>${e}</option>`)}
                  </tui-select></label
                >
                <div aria-hidden="true">&nbsp;</div>
                ${this.artifactLoading?`Loading artifact…`:this.artifactError?j`<tui-text variant="error"
                          >${this.artifactError}</tui-text
                        >`:j`<pre
                          style="white-space: pre-wrap; overflow-wrap: anywhere"
                        >
${this.artifactContent}</pre>`}
              `:`No artifacts have been written for this unit.`}
      </tui-modal>
    `:``}render(){let e=this.status.error??this.units.error??this.allUnits.error??this.history.error,t=!this.status.value&&this.status.loading||!this.allUnits.value&&this.allUnits.loading,n=this.status.value?.enabled,r=t?j`<tui-text>loading</tui-text>`:e&&!this.status.value?j`<tui-text variant="error">unavailable</tui-text>`:j`<tui-text variant=${n?`success`:``}
            >${n?`enabled`:`paused`}</tui-text
          >`,i;return i=this.tab===`tasks`?j`<sentinel-tasks></sentinel-tasks>`:t?j`<div>Loading research pipeline…</div>`:e&&!this.status.value?j`<tui-text variant="error">${e.message}</tui-text>`:this.tab===`units`?this.renderUnits():this.tab===`history`?this.renderHistory():this.renderStatus(),j`
      <div>Pipeline ${r}</div>
      <tui-radio-buttonset
        aria-label="Research pipeline view"
        value=${this.tab}
        @change=${this.changeTab}
      >
        <tui-radio-button value="status">Status</tui-radio-button>
        <tui-radio-button value="units">Units</tui-radio-button>
        <tui-radio-button value="history">History</tui-radio-button>
        <tui-radio-button value="tasks">Tasks</tui-radio-button>
      </tui-radio-buttonset>
      <div aria-hidden="true">&nbsp;</div>
      ${i}
      ${this.tab!==`tasks`&&this.notice?j`<div aria-live="polite">${this.notice}</div>`:``}
      ${this.tab!==`tasks`&&this.actionError?j`<tui-text variant="error">${this.actionError}</tui-text>`:``}
      ${this.renderArtifactModal()}
    `}};customElements.define(`sentinel-research`,gt);var _t={minutes:1,hours:60,days:1440};function vt(e){return e>=1440&&e%1440==0?{value:e/1440,unit:`days`}:e>=60&&e%60==0?{value:e/60,unit:`hours`}:{value:e,unit:`minutes`}}var yt=class extends R{static properties={tab:{state:!0},busyAction:{state:!0},actionError:{state:!0},notice:{state:!0}};constructor(){super(),this.tab=`status`,this.busyAction=``,this.actionError=``,this.notice=``}schedules=new U(this,e=>z(`/api/jobs/schedules`,{signal:e}),{interval:5e3});status=new U(this,e=>z(`/api/jobs`,{signal:e}),{interval:3e3});history=new U(this,e=>z(`/api/jobs/history?limit=100`,{signal:e}),{interval:1e4});createRenderRoot(){return this}async updateSchedule(e,t){this.busyAction=`update:${e}`,this.actionError=``,this.notice=``;try{await B(`/api/jobs/schedules/${encodeURIComponent(e)}`,t),this.notice=`${e} updated`,await this.schedules.refresh()}catch(e){this.actionError=e.message}finally{this.busyAction=``}}async runJob(e){this.busyAction=`run:${e}`,this.actionError=``,this.notice=``;try{await V(`/api/jobs/${encodeURIComponent(e)}/run`),this.notice=`${e} started`,await Promise.all([this.status.refresh(),this.schedules.refresh(),this.history.refresh()])}catch(e){this.actionError=e.message}finally{this.busyAction=``}}updateInterval(e,t,n,r){let i=Math.round(Number(n)*_t[r]);i>0&&this.updateSchedule(e.job_type,{[t]:i})}renderInterval(e,t,n){let r=vt(Number(e[t]??e.interval_minutes));return j`
      <label
        >${n}&nbsp;<tui-input
          type="number"
          min="1"
          max="10080"
          value=${r.value}
          ?disabled=${this.busyAction!==``}
          @change=${n=>this.updateInterval(e,t,n.currentTarget.value,r.unit)}
        ></tui-input
      ></label>
      <tui-select
        aria-label="${n} unit for ${e.job_type}"
        value=${r.unit}
        ?disabled=${this.busyAction!==``}
        @change=${n=>this.updateInterval(e,t,r.value,n.currentTarget.value)}
      >
        <option value="minutes">Minutes</option>
        <option value="hours">Hours</option>
        <option value="days">Days</option>
      </tui-select>
    `}renderStatus(){let e=this.status.value??{};return j`
      <tui-box heading="Currently Running" border="single">
        ${e.current??`No job running`}
      </tui-box>
      <div aria-hidden="true">&nbsp;</div>
      <tui-box heading="Upcoming Jobs" border="single">
        ${e.upcoming?.length?e.upcoming.map(e=>j`
                  <div>
                    ${e.job_type} │ ${q(e.next_run)}
                  </div>
                `):`No upcoming jobs`}
      </tui-box>
      <div aria-hidden="true">&nbsp;</div>
      <tui-box heading="Recent Jobs" border="single">
        ${e.recent?.length?e.recent.map(e=>j`
                  <div>
                    ${e.job_type} │
                    <tui-text variant=${Y(e.status)||``}
                      >${e.status}</tui-text
                    >
                    │ ${q(e.executed_at)}
                  </div>
                `):`No recent jobs`}
      </tui-box>
    `}renderJob(e){let t=this.busyAction!==``;return j`
      <div>
        <tui-flex align="baseline" justify="between" wrap>
          <span>
            ${e.job_type}
            ${e.last_status?j`<tui-text variant=${Y(e.last_status)||``}
                    >${e.last_status}</tui-text
                  >`:``}
          </span>
          <span>
            <label
              >Timing&nbsp;<tui-select
                value=${String(e.market_timing)}
                ?disabled=${t}
                @change=${t=>this.updateSchedule(e.job_type,{market_timing:Number(t.currentTarget.value)})}
              >
                <option value="0">Any time</option>
                <option value="1">After close</option>
                <option value="2">During open</option>
                <option value="3">All closed</option>
              </tui-select></label
            >
            <tui-button
              ?disabled=${t}
              @click=${()=>this.runJob(e.job_type)}
              >${this.busyAction===`run:${e.job_type}`?`Running…`:`Run`}</tui-button
            >
          </span>
        </tui-flex>
        <div>${e.description??``}</div>
        <tui-flex align="baseline" wrap>
          ${this.renderInterval(e,`interval_minutes`,`Interval`)}
          <span aria-hidden="true">&nbsp;│&nbsp;</span>
          ${this.renderInterval(e,`interval_market_open_minutes`,`Market open`)}
          ${e.next_run?j`<span aria-hidden="true">&nbsp;│&nbsp;</span
                  ><span>Next ${q(e.next_run)}</span>`:``}
        </tui-flex>
      </div>
    `}renderJobs(){let e=this.schedules.value?.schedules??[];return[...new Set(e.map(e=>e.category).filter(Boolean))].map((t,n)=>j`
        ${n>0?j`<div aria-hidden="true">&nbsp;</div>`:``}
        <tui-box heading=${t} border="single">
          ${e.filter(e=>e.category===t).map((e,t)=>j`
                ${t>0?j`<div aria-hidden="true">────────────────</div>`:``}
                ${this.renderJob(e)}
              `)}
        </tui-box>
      `)}renderHistory(){let e=this.history.value?.history??[];return e.length===0?j`<div>No execution history</div>`:j`
      <div style="overflow: auto; min-width: 0">
        <table style="border-collapse: collapse; width: 100%">
          <thead>
            <tr>
              <th style="text-align: left">Job ID</th>
              <th style="text-align: left">│ Status</th>
              <th style="text-align: left">│ Duration</th>
              <th style="text-align: left">│ Executed</th>
              <th style="text-align: left">│ Error</th>
            </tr>
          </thead>
          <tbody>
            ${e.map(e=>j`
                <tr>
                  <td style="text-align: left; vertical-align: top">
                    ${e.job_id}
                  </td>
                  <td style="text-align: left; vertical-align: top">
                    │
                    <tui-text variant=${Y(e.status)||``}
                      >${e.status}</tui-text
                    >
                  </td>
                  <td style="text-align: left; vertical-align: top">
                    │ ${J(e.duration_ms)}
                  </td>
                  <td style="text-align: left; vertical-align: top">
                    │ ${nt(e.executed_at,{seconds:!0})}
                  </td>
                  <td
                    style="text-align: left; vertical-align: top; overflow-wrap: anywhere"
                  >
                    │ ${e.error??`-`}
                  </td>
                </tr>
              `)}
          </tbody>
        </table>
      </div>
    `}render(){let e=this.schedules.error??this.status.error??this.history.error;return!this.schedules.value&&this.schedules.loading||!this.status.value&&this.status.loading||!this.history.value&&this.history.loading?j`<div>Loading scheduler…</div>`:e?j`<tui-text variant="error"
        >Error loading scheduler: ${e.message}</tui-text
      >`:j`
      <tui-radio-buttonset
        aria-label="Scheduler view"
        value=${this.tab}
        @change=${e=>this.tab=e.currentTarget.value}
      >
        <tui-radio-button value="status">Status</tui-radio-button>
        <tui-radio-button value="jobs">Jobs</tui-radio-button>
        <tui-radio-button value="history">History</tui-radio-button>
      </tui-radio-buttonset>
      <div aria-hidden="true">&nbsp;</div>
      ${this.tab===`jobs`?this.renderJobs():this.tab===`history`?this.renderHistory():this.renderStatus()}
      ${this.notice?j`<div aria-live="polite">${this.notice}</div>`:``}
      ${this.actionError?j`<tui-text variant="error">${this.actionError}</tui-text>`:``}
    `}};customElements.define(`sentinel-scheduler`,yt);var bt=[{key:`trading_mode`,label:`Trading Mode`,description:`Research mode simulates trades without executing`,type:`select`,default:`research`,options:[[`research`,`Research (Paper Trading)`],[`live`,`Live Trading`]]},{key:`max_position_pct`,label:`Max Position %`,description:`Maximum allocation to a single security`,type:`number`,default:20,min:5,max:100},{key:`min_position_pct`,label:`Min Position %`,description:`Minimum allocation to maintain a position`,type:`number`,default:2,min:.5,max:20,step:.5},{key:`target_cash_pct`,label:`Target Cash %`,description:`Target cash allocation in portfolio`,type:`number`,default:0,min:0,max:50},{key:`min_cash_buffer`,label:`Min Cash Buffer %`,description:`Minimum cash to keep as safety buffer`,type:`number`,default:.005,min:0,max:10,step:.01,scale:100},{key:`min_trade_value`,label:`Min Trade Value (EUR)`,description:`Minimum trade value in EUR`,type:`number`,default:100,min:10,max:1e4}],xt=[{key:`transaction_fee_fixed`,label:`Fixed Transaction Fee (EUR)`,description:`Fixed fee per trade`,type:`number`,default:2,min:0,max:50,step:.01},{key:`transaction_fee_percent`,label:`Variable Transaction Fee %`,description:`Fee as percentage of trade value`,type:`number`,default:.2,min:0,max:5,step:.01}],St=[[`strategy_min_opp_score`,`Minimum Opportunity Score`,.55,0,1,.001,`Minimum opp score required to enter opportunity sleeve`],[`strategy_ideal_qualifying_threshold`,`Ideal Qualification Threshold`,.65,0,1,.001,`Minimum AI research multiplier required for an ideal target`],[`strategy_core_timing_min_score`,`Core Timing Score`,.3,0,1,.001,`Minimum opportunity score for a normally timed core buy`],[`strategy_core_timing_min_dip_score`,`Core Timing Dip`,.2,0,1,.001,`Minimum dip score for a normally timed core buy`],[`strategy_fallback_wait_days`,`Fallback Wait`,30,0,365,1,`Days without an executable opportunity before one convergence buy`],[`strategy_entry_t1_dd`,`Entry T1 Drawdown`,-.1,-.9,0,.001,`First opportunity tranche threshold (dd252)`],[`strategy_entry_t2_dd`,`Entry T2 Drawdown`,-.16,-.9,0,.001,`Second opportunity tranche threshold (dd252)`],[`strategy_entry_t3_dd`,`Entry T3 Drawdown`,-.22,-.9,0,.001,`Third opportunity tranche threshold (dd252)`],[`strategy_entry_memory_days`,`Entry Memory Days`,45,1,252,1,`Keep recent-dip memory active for post-turn entries`],[`strategy_memory_max_boost`,`Memory Max Boost`,.12,0,.5,.001,`Maximum boost added to opp score from recent dip memory`],[`strategy_opportunity_addon_threshold`,`Opportunity Add-On Threshold`,.75,0,1,.001,`Allow add-on buys for held opportunity names above this score`],[`strategy_max_opportunity_buys_per_cycle`,`Max Opportunity Buys / Cycle`,1,0,50,1,`Hard cap on total opportunity buys per rebalance cycle`],[`strategy_max_new_opportunity_buys_per_cycle`,`Max New Opportunity Buys / Cycle`,1,0,50,1,`Hard cap on opening new opportunity positions per cycle`]].map(([e,t,n,r,i,a,o])=>({key:e,label:t,default:n,min:r,max:i,step:a,description:o,type:`number`})),Ct=[[`rebalance_threshold_pct`,`Rebalance Threshold %`,5,1,20,1,`Minimum deviation to trigger rebalance`],[`strategy_lot_standard_max_pct`,`Standard Lot Max %`,.08,0,100,.01,`Max ticket size treated as standard lot class`,100],[`strategy_lot_coarse_max_pct`,`Coarse Lot Max %`,.3,0,100,.01,`Max ticket size treated as coarse lot class`,100],[`strategy_coarse_max_new_lots_per_cycle`,`Coarse Max New Lots`,1,1,10,1,`Max new coarse lots per rebalance cycle`],[`strategy_opportunity_cooloff_days`,`Opportunity Cool-Off Days`,7,0,365,1,`Minimum days between opposite actions for opportunity sleeve`],[`strategy_core_cooloff_days`,`Core Cool-Off Days`,21,0,365,1,`Minimum days between opposite actions for core sleeve`],[`strategy_same_side_cooloff_days`,`Same-Side Cool-Off Days`,15,0,365,1,`Minimum days between same-side actions`],[`strategy_rotation_time_stop_days`,`Rotation Time-Stop Days`,90,1,365,1,`Exit opportunity positions if the thesis stalls beyond this horizon`]].map(([e,t,n,r,i,a,o,s])=>({key:e,label:t,default:n,min:r,max:i,step:a,description:o,scale:s,type:`number`})),wt=[{key:`forecasting_enabled`,label:`Forecast timing`,description:`Use stored forecasts as a bounded opportunity-score modifier`,type:`toggle`,default:!0},{key:`forecasting_service_url`,label:`Forecasting Service URL`,type:`text`,default:`http://127.0.0.1:8010`},{key:`forecasting_provider`,label:`Provider`,type:`select`,default:`toto2`,options:[[`toto2`,`Toto 2.0`],[`naive`,`Naive local test provider`]]},{key:`forecasting_model_id`,label:`Model ID`,type:`text`,default:`Datadog/Toto-2.0-1B`},{key:`forecasting_horizon_weeks`,label:`Horizon (weeks)`,description:`Forecast horizon in weekly steps`,type:`number`,default:4,min:1,max:52},{key:`forecasting_context_weeks`,label:`Context (weeks)`,description:`Maximum weekly return history sent to the model`,type:`number`,default:520,min:104,max:1040},{key:`forecasting_min_history_weeks`,label:`Minimum History (weeks)`,type:`number`,default:104,min:52,max:520},{key:`forecasting_max_group_variates`,label:`Max Group Variates`,description:`Maximum securities in one grouped multivariate request`,type:`number`,default:32,min:1,max:256},{key:`forecasting_stale_after_days`,label:`Stale Price Limit (days)`,type:`number`,default:21,min:1,max:120},{key:`forecasting_max_missing_ratio`,label:`Max Missing Input %`,description:`Forecast run fails above this unusable-symbol ratio`,type:`number`,default:.25,min:0,max:100,step:.1,scale:100},{key:`forecasting_score_max_age_days`,label:`Score Freshness (days)`,description:`Planner ignores forecast scores older than this`,type:`number`,default:14,min:1,max:90},{key:`forecasting_timing_weight`,label:`Timing Weight`,description:`Maximum absolute opportunity-score adjustment`,type:`number`,default:.15,min:0,max:.5,step:.001}],Tt=[[`Model and research tools`,[{key:`ai_llm_base_url`,label:`LLM URL`,type:`text`,default:``},{key:`ai_llm_model`,label:`Model`,type:`model`,default:``},{key:`ai_llm_api_key`,label:`LLM API key`,type:`password`,default:``},{key:`ai_searxng_base_url`,label:`Search URL`,type:`text`,default:``},{key:`ai_browser_search_base_url`,label:`Search fallback`,type:`text`,default:``},{key:`ai_url_summarizer_base_url`,label:`URL summarizer`,type:`text`,default:``}]],[`Research memory`,[{key:`ai_pg_host`,label:`PostgreSQL host`,type:`text`,default:``},{key:`ai_pg_port`,label:`PostgreSQL port`,type:`number`,default:5432,min:1,max:65535},{key:`ai_pg_database`,label:`Database`,type:`text`,default:``},{key:`ai_pg_user`,label:`Database user`,type:`text`,default:``},{key:`ai_pg_password`,label:`Database password`,type:`password`,default:``},{key:`ai_embed_base_url`,label:`Embedding URL`,type:`text`,default:``},{key:`ai_embed_model`,label:`Embedding model`,type:`text`,default:``},{key:`ai_embed_dims`,label:`Embedding dimensions`,type:`number`,default:768,min:1},{key:`ai_memory_user_id`,label:`Memory user`,type:`text`,default:``},{key:`ai_memory_collection`,label:`Memory collection`,type:`text`,default:``}]],[`Cadence and limits`,[{key:`ai_dedup_similarity_threshold`,label:`Dedup similarity`,type:`number`,default:.96,min:0,max:1,step:.01},{key:`ai_llm_timeout_seconds`,label:`LLM timeout (seconds)`,type:`number`,default:600,min:1},{key:`ai_max_tool_calls`,label:`Maximum tool calls`,type:`number`,default:40,min:1,max:100},{key:`ai_max_tool_loop_iterations`,label:`Maximum tool rounds`,type:`number`,default:40,min:1,max:100}]]],Et=[{key:`tradernet_api_key`,label:`Tradernet API Key`,description:`Your Tradernet public API key`,type:`text`,default:``},{key:`tradernet_api_secret`,label:`Tradernet API Secret`,description:`Your Tradernet private API secret`,type:`password`,default:``},{key:`freedom24_login`,label:`Freedom24 Login`,description:`Email used to sign in at freedom24.com`,type:`text`,default:``},{key:`freedom24_password`,label:`Freedom24 Password`,description:`Web login password, not your API secret`,type:`password`,default:``}],Dt=[{key:`r2_account_id`,label:`R2 Account ID`,description:`Your Cloudflare account ID`,type:`text`,default:``},{key:`r2_access_key`,label:`R2 Access Key`,description:`R2 API token access key`,type:`text`,default:``},{key:`r2_secret_key`,label:`R2 Secret Key`,description:`R2 API token secret key`,type:`password`,default:``},{key:`r2_bucket_name`,label:`R2 Bucket Name`,description:`Name of the R2 bucket to store backups`,type:`text`,default:``},{key:`r2_backup_retention_days`,label:`Retention Days`,description:`Automatically delete backups older than this`,type:`number`,default:30,min:1,max:365}],Ot=class extends R{static properties={tab:{state:!0},strategyDraft:{state:!0},busyKey:{state:!0},notice:{state:!0},actionError:{state:!0}};constructor(){super(),this.tab=`trading`,this.strategyDraft=void 0,this.busyKey=``,this.notice=``,this.actionError=``}settings=new U(this,e=>z(`/api/settings`,{signal:e}),{interval:0});models=new U(this,e=>z(`/api/ai/models`,{signal:e}),{interval:0});createRenderRoot(){return this}updated(){this.settings.value&&!this.strategyDraft&&(this.strategyDraft=Object.fromEntries(St.map(e=>[e.key,Number(this.settings.value[e.key]??e.default)])))}displayValue(e,t=this.settings.value){let n=t?.[e.key]??e.default;return e.scale?Number(n)*e.scale:n}parseValue(e,t){if(e.type!==`number`)return t;let n=Number(t);return e.scale?n/e.scale:n}async updateSetting(e,t){let n=this.parseValue(e,t),r=this.settings.value?.[e.key];this.busyKey=e.key,this.notice=``,this.actionError=``,this.settings.value={...this.settings.value,[e.key]:n},this.requestUpdate();try{await B(`/api/settings/${encodeURIComponent(e.key)}`,{value:n}),this.notice=`${e.label} saved`,window.dispatchEvent(new CustomEvent(`sentinel-setting-changed`,{detail:{key:e.key,value:n}}))}catch(t){this.settings.value={...this.settings.value,[e.key]:r},this.actionError=t.message,this.requestUpdate()}finally{this.busyKey=``}}changeStrategy(e,t){this.strategyDraft={...this.strategyDraft,[e.key]:Number(t)}}async applyStrategy(){this.busyKey=`strategy`,this.notice=``,this.actionError=``;try{await B(`/api/settings`,{values:this.strategyDraft}),this.settings.value={...this.settings.value,...this.strategyDraft},this.notice=`Strategy tuning saved`}catch(e){this.actionError=e.message}finally{this.busyKey=``}}renderField(e,t=this.settings.value,n=!1){let r=this.displayValue(e,t),i=this.busyKey!==``,a;if(e.type===`toggle`)a=j`<tui-toggle
        ?checked=${!!r}
        ?disabled=${i}
        @change=${t=>this.updateSetting(e,t.currentTarget.checked)}
        >${e.label}</tui-toggle
      >`;else if(e.type===`select`)a=j`<label
        >${e.label}&nbsp;<tui-select
          value=${r}
          ?disabled=${i}
          @change=${t=>this.updateSetting(e,t.currentTarget.value)}
        >
          ${e.options.map(([e,t])=>j`
              <option value=${e}>${t}</option>
            `)}
        </tui-select></label
      >`;else{let t=e.type===`password`?`password`:e.type===`number`?`number`:`text`;a=j`<label
        ><span>${e.label}</span>
        <tui-input
          block
          type=${t}
          value=${r??``}
          min=${e.min??``}
          max=${e.max??``}
          step=${e.step??(e.type===`number`?1:``)}
          list=${e.type===`model`?`sentinel-ai-models`:``}
          ?disabled=${i}
          @change=${t=>n?this.changeStrategy(e,t.currentTarget.value):this.updateSetting(e,t.currentTarget.value)}
        ></tui-input
      ></label>`}return j`
      <div style="min-width: 0; overflow-wrap: anywhere">
        ${a}
        ${e.description?j`<div>${e.description}</div>`:``}
      </div>
    `}renderFields(e,t=this.settings.value,n=!1){return e.map((e,r)=>j`
        ${r>0?j`<div aria-hidden="true">&nbsp;</div>`:``}
        ${this.renderField(e,t,n)}
      `)}renderResearch(){return j`
      <datalist id="sentinel-ai-models">
        ${(this.models.value?.models??[]).map(e=>j`<option value=${e}></option>`)}
      </datalist>
      ${Tt.map(([e,t],n)=>j`
          ${n>0?j`<div aria-hidden="true">&nbsp;</div>`:``}
          <tui-box heading=${e} border="single">
            <tui-flex align="start" wrap>
              ${t.map(e=>j`
                  <div style="flex: 1 1 38ch; min-width: 0">
                    ${this.renderField(e)}
                  </div>
                `)}
            </tui-flex>
            ${e===`Model and research tools`?j`<div>
                    <tui-button @click=${()=>this.models.refresh()}
                      >Refresh available models</tui-button
                    >
                    ${this.models.error?j`<tui-text variant="error"
                            >${this.models.error.message}</tui-text
                          >`:``}
                  </div>`:``}
          </tui-box>
        `)}
    `}renderPanel(){switch(this.tab){case`fees`:return this.renderFields(xt);case`strategy`:return j`
          <tui-box heading="Strategy Tuning" border="single">
            ${this.renderFields(St,this.strategyDraft,!0)}
            <div aria-hidden="true">&nbsp;</div>
            <tui-button
              ?disabled=${this.busyKey!==``}
              @click=${this.applyStrategy}
              >Apply Strategy Tuning</tui-button
            >
          </tui-box>
          <div aria-hidden="true">&nbsp;</div>
          ${this.renderFields(Ct)}
        `;case`forecasting`:return this.renderFields(wt);case`research`:return this.renderResearch();case`api`:return j`
          ${this.renderFields(Et.slice(0,2))}
          <div aria-hidden="true">&nbsp;</div>
          <tui-box heading="Freedom24 web login" border="single">
            <div>
              Used only to fetch PRAAMS portfolio-structure data not exposed by
              the public API.
            </div>
            ${this.renderFields(Et.slice(2))}
          </tui-box>
        `;case`backup`:return j`
          <div>
            Back up the database, runtime state, task definitions, and research
            artifacts to Cloudflare R2.
          </div>
          <div aria-hidden="true">&nbsp;</div>
          ${this.renderFields(Dt)}
        `;default:return this.renderFields(bt)}}render(){return this.settings.loading&&!this.settings.value?j`<div>Loading settings…</div>`:this.settings.error?j`<tui-text variant="error"
        >Error loading settings: ${this.settings.error.message}</tui-text
      >`:j`
      <tui-radio-buttonset
        aria-label="Settings section"
        value=${this.tab}
        @change=${e=>this.tab=e.currentTarget.value}
      >
        <tui-radio-button value="trading">Trading</tui-radio-button>
        <tui-radio-button value="fees">Fees</tui-radio-button>
        <tui-radio-button value="strategy">Strategy</tui-radio-button>
        <tui-radio-button value="forecasting">Forecasts</tui-radio-button>
        <tui-radio-button value="research">Research</tui-radio-button>
        <tui-radio-button value="api">API</tui-radio-button>
        <tui-radio-button value="backup">Backup</tui-radio-button>
      </tui-radio-buttonset>
      <div aria-hidden="true">&nbsp;</div>
      ${this.renderPanel()}
      ${this.busyKey?j`<div aria-live="polite">Saving ${this.busyKey}…</div>`:``}
      ${this.notice?j`<div aria-live="polite">${this.notice}</div>`:``}
      ${this.actionError?j`<tui-text variant="error">${this.actionError}</tui-text>`:``}
    `}};customElements.define(`sentinel-settings`,Ot);var kt=class extends R{static properties={page:{state:!0},symbol:{state:!0},side:{state:!0},startDate:{state:!0},endDate:{state:!0},syncing:{state:!0},actionError:{state:!0}};constructor(){super(),this.page=1,this.symbol=``,this.side=``,this.startDate=``,this.endDate=``,this.syncing=!1,this.actionError=``}pageSize=20;securities=new U(this,e=>z(`/api/securities`,{signal:e}),{interval:6e4});trades=new U(this,e=>z(this.tradesPath,{signal:e}),{interval:3e4});createRenderRoot(){return this}get tradesPath(){let e=new URLSearchParams({limit:String(this.pageSize),offset:String((this.page-1)*this.pageSize)});return this.symbol&&e.set(`symbol`,this.symbol),this.side&&e.set(`side`,this.side),this.startDate&&e.set(`start_date`,this.startDate),this.endDate&&e.set(`end_date`,this.endDate),`/api/trades?${e}`}changeFilter(e,t){this[e]=t,this.page=1,this.trades.refresh()}changePage(e){this.page=e,this.trades.refresh()}async syncTrades(){this.syncing=!0,this.actionError=``;try{await V(`/api/trades/sync`),await this.trades.refresh()}catch(e){this.actionError=e.message}finally{this.syncing=!1}}renderControls(){let e=(this.securities.value??[]).map(e=>e.symbol).sort();return j`
      <tui-flex align="baseline" wrap>
        <label
          >Symbol&nbsp;<tui-select
            value=${this.symbol}
            @change=${e=>this.changeFilter(`symbol`,e.currentTarget.value)}
          >
            <option value="">All symbols</option>
            ${e.map(e=>j`<option value=${e}>${e}</option>`)}
          </tui-select></label
        >
        <span aria-hidden="true">&nbsp;│&nbsp;</span>
        <label
          >Side&nbsp;<tui-select
            value=${this.side}
            @change=${e=>this.changeFilter(`side`,e.currentTarget.value)}
          >
            <option value="">All</option>
            <option value="BUY">Buy</option>
            <option value="SELL">Sell</option>
          </tui-select></label
        >
        <span aria-hidden="true">&nbsp;│&nbsp;</span>
        <label
          >From&nbsp;<tui-input
            type="date"
            value=${this.startDate}
            @change=${e=>this.changeFilter(`startDate`,e.currentTarget.value)}
          ></tui-input
        ></label>
        <span aria-hidden="true">&nbsp;│&nbsp;</span>
        <label
          >To&nbsp;<tui-input
            type="date"
            value=${this.endDate}
            @change=${e=>this.changeFilter(`endDate`,e.currentTarget.value)}
          ></tui-input
        ></label>
        <span aria-hidden="true">&nbsp;│&nbsp;</span>
        <tui-button ?disabled=${this.syncing} @click=${this.syncTrades}
          >${this.syncing?`Syncing…`:`Sync from Broker`}</tui-button
        >
      </tui-flex>
    `}renderTable(){let e=this.trades.value?.trades??[];return e.length===0?j`<div>No trades found</div>`:j`
      <div style="overflow: auto; min-width: 0">
        <table style="border-collapse: collapse; width: 100%">
          <thead>
            <tr>
              <th style="text-align: left">Date</th>
              <th style="text-align: left">│ Symbol</th>
              <th style="text-align: left">│ Side</th>
              <th style="text-align: left">│ Qty</th>
              <th style="text-align: left">│ Price</th>
              <th style="text-align: left">│ Value</th>
              <th style="text-align: left">│ Commission</th>
              <th style="text-align: left">│ Currency</th>
            </tr>
          </thead>
          <tbody>
            ${e.map(e=>{let t=e.raw_data??{},n=Number(t.q??e.quantity??0),r=Number(t.p??e.price??0),i=Number(t.v??n*r),a=Number(t.commiss_exchange??e.commission??0),o=t.curr_c??e.commission_currency??`-`;return j`
                <tr>
                  <td style="text-align: left; vertical-align: top">
                    ${nt(e.executed_at,{seconds:!0})}
                  </td>
                  <td style="text-align: left; vertical-align: top">
                    │ ${e.symbol}
                  </td>
                  <td style="text-align: left; vertical-align: top">
                    │
                    <tui-text
                      variant=${e.side===`BUY`?`success`:`error`}
                      >${e.side}</tui-text
                    >
                  </td>
                  <td style="text-align: left; vertical-align: top">
                    │ ${K(n,0)}
                  </td>
                  <td style="text-align: left; vertical-align: top">
                    │ ${K(r,2)}
                  </td>
                  <td style="text-align: left; vertical-align: top">
                    │ ${K(i,2)}
                  </td>
                  <td style="text-align: left; vertical-align: top">
                    │ ${K(a,2)}
                  </td>
                  <td style="text-align: left; vertical-align: top">
                    │ ${o}
                  </td>
                </tr>
              `})}
          </tbody>
        </table>
      </div>
    `}renderPagination(){let e=this.trades.value?.total??this.trades.value?.count??0,t=Math.max(1,Math.ceil(e/this.pageSize));return t===1?``:j`
      <div>
        <tui-button
          ?disabled=${this.page<=1}
          @click=${()=>this.changePage(this.page-1)}
          >Previous</tui-button
        >
        Page ${this.page} / ${t}
        <tui-button
          ?disabled=${this.page>=t}
          @click=${()=>this.changePage(this.page+1)}
          >Next</tui-button
        >
      </div>
    `}render(){return this.securities.loading&&!this.securities.value?j`<div>Loading trade filters…</div>`:j`
      ${this.renderControls()}
      <div aria-hidden="true">&nbsp;</div>
      ${this.trades.loading&&!this.trades.value?j`<div>Loading trades…</div>`:this.trades.error?j`<tui-text variant="error"
                >Error loading trades: ${this.trades.error.message}</tui-text
              >`:this.renderTable()}
      ${this.renderPagination()}
      ${this.actionError?j`<tui-text variant="error">${this.actionError}</tui-text>`:``}
    `}};customElements.define(`sentinel-trades`,kt);var At=[{id:`backtest`,label:`Backtest`,heading:`Backtest`,researchOnly:!0},{id:`trades`,label:`Trades`,heading:`Trade History`},{id:`scheduler`,label:`Scheduler`,heading:`Scheduler`},{id:`research`,label:`Research`,heading:`Research Pipeline`},{id:`settings`,label:`Settings`,heading:`Settings`}],jt=class extends R{static properties={activeModal:{state:!0}};constructor(){super(),this.activeModal=void 0}health=new U(this,e=>z(`/api/health`,{signal:e}),{interval:3e4});refreshHealth=()=>this.health.refresh();connectedCallback(){super.connectedCallback(),window.addEventListener(`sentinel-setting-changed`,this.refreshHealth)}disconnectedCallback(){window.removeEventListener(`sentinel-setting-changed`,this.refreshHealth),super.disconnectedCallback()}createRenderRoot(){return this}openModal(e){this.activeModal=e}closeModal(e){this.activeModal===e&&(this.activeModal=void 0)}requestModalClose(e){let t=e.currentTarget.querySelectorAll(`sentinel-backtest, sentinel-research, sentinel-scheduler, sentinel-settings, sentinel-tasks, sentinel-trades`);for(let n of t)if(n.confirmClose&&!n.confirmClose()){e.preventDefault();return}}get visibleActions(){let e=this.health.value?.trading_mode===`live`;return At.filter(t=>!t.researchOnly||!e)}renderAction(e,t){let n=`sentinel-${e.id}-modal`;return j`
      ${t>0?j`<span aria-hidden="true">&nbsp;</span>`:``}
      <tui-button
        aria-controls=${n}
        aria-expanded=${this.activeModal===e.id?`true`:`false`}
        inverted
        @click=${()=>this.openModal(e.id)}
        >${e.label}</tui-button
      >
    `}renderModalContent(e){switch(e){case`backtest`:return j`<sentinel-backtest></sentinel-backtest>`;case`trades`:return j`<sentinel-trades></sentinel-trades>`;case`scheduler`:return j`<sentinel-scheduler></sentinel-scheduler>`;case`research`:return j`<sentinel-research></sentinel-research>`;case`settings`:return j`<sentinel-settings></sentinel-settings>`;default:return``}}renderModal(){let e=At.find(({id:e})=>e===this.activeModal);return e?j`
      <tui-modal
        id=${`sentinel-${e.id}-modal`}
        heading=${e.heading}
        open
        @cancel=${this.requestModalClose}
        @close=${()=>this.closeModal(e.id)}
        >${this.renderModalContent(e.id)}</tui-modal
      >
    `:``}render(){return j`
      <header>
        <tui-bar>
          <nav aria-label="Application">
            <tui-flex align="baseline" wrap>
              ${this.visibleActions.map((e,t)=>this.renderAction(e,t))}
            </tui-flex>
          </nav>
        </tui-bar>
        ${this.renderModal()}
      </header>
    `}};customElements.define(`sentinel-header`,jt);var Mt=class extends R{planner=new U(this,e=>z(`/api/planner/recommendations`,{signal:e}),{interval:6e4});createRenderRoot(){return this}renderRecommendation(e,t){let n=e.action===`sell`,r=n&&e.current_value_eur>0?` ${Math.round(Math.abs(e.value_delta_eur)/e.current_value_eur*100)}%`:``;return j`
      <tui-text variant=${n?`error`:`success`} title=${e.reason??``}
        >${t>0?j`<span aria-hidden="true">&nbsp;&nbsp;</span>`:``}${e.action.toUpperCase()}
        ${W(Math.abs(e.value_delta_eur))}${r}
        ${e.symbol}</tui-text
      >
    `}targetItems(e){if(!e)return[];let t={symbol:`CASH`,target_value_eur:Number(e.target_cash_value_eur??0),gap_eur:Number(e.cash_gap_eur??0),isCash:!0},n=[...e.targets??[]];return(t.target_value_eur>0||Number(e.current_cash_eur??0)>0)&&n.push(t),n.filter(e=>Math.abs(Number(e.gap_eur??0))>.005).sort((e,t)=>Math.abs(Number(t.gap_eur))-Math.abs(Number(e.gap_eur))).slice(0,6)}renderTarget(e,t){let n=Number(e.gap_eur??0),r=Number(e.quantity_delta??0),i=!e.isCash&&Math.abs(r)>1e-4?j`&nbsp;·&nbsp;${r>0?`+`:`-`}${Math.abs(r).toLocaleString()}
          sh`:``;return j`
      <span title=${e.isCash?`Cash left after deploying all affordable whole-lot purchases`:`AI research ${Number(e.ai_research_multiplier??0).toFixed(2)}, opportunity ${Number(e.opportunity_score??0).toFixed(2)}`}
        >${t>0?j`<span aria-hidden="true">&nbsp;&nbsp;</span>`:``}${e.symbol}&nbsp;${W(e.target_value_eur)}
        (${n>=0?`+`:`-`}${W(Math.abs(n))}${i})</span
      >
    `}renderPlanner(e){let t=e.recommendations??[],n=e.plan,r=e.summary,i=this.targetItems(n),a=r?.valid_for_minutes?`Next ${r.valid_for_minutes} min:`:`Next cycle:`,o=`${n?.horizon_months??12} mo gaps:`;return j`
      <tui-flex wrap>
        <span>${a}&nbsp;</span>
        ${t.length>0?t.map((e,t)=>this.renderRecommendation(e,t)):j`<span>No pending actions</span>`}
      </tui-flex>
      <tui-flex wrap>
        <span>${o}&nbsp;</span>
        ${i.length>0?i.map((e,t)=>this.renderTarget(e,t)):j`<span>Target unavailable</span>`}
      </tui-flex>
      ${n?j`
              <tui-flex wrap>
                <span
                  >${W(n.terminal_portfolio_value_eur)} by
                  ${n.horizon_end_date}</span
                >
                <span aria-hidden="true">&nbsp;·&nbsp;</span>
                <span
                  >${W(n.avg_monthly_net_deposit_eur)}/mo</span
                >
                <span aria-hidden="true">&nbsp;·&nbsp;</span>
                <span>${(n.targets??[]).length} securities</span>
                ${r?j`
                        <span aria-hidden="true">&nbsp;·&nbsp;</span>
                        <span
                          >cash after today
                          ${W(r.cash_after_plan)}</span
                        >
                      `:``}
              </tui-flex>
            `:``}
    `}render(){let e;return e=this.planner.loading&&!this.planner.value?j`<span>Loading plan…</span>`:this.planner.error?j`<tui-text variant="error">Plan unavailable</tui-text>`:this.renderPlanner(this.planner.value),j`<tui-box heading="Plan" border="single">${e}</tui-box>`}};customElements.define(`sentinel-planner-status`,Mt);var Nt=[`1D`,`1W`,`1M`,`3M`,`6M`,`1Y`,`YTD`,`All`];function Pt(e){return e.findLast(Number.isFinite)}function Ft(e){if(e==null||Number.isNaN(e))return`-`;let t=e>=0?`+`:`-`,n=Math.abs(e);return n>=1e6?`${t}€${(n/1e6).toFixed(1)}M`:n>=1e3?`${t}€${(n/1e3).toFixed(1)}K`:`${t}€${n.toFixed(0)}`}function It(e){if(e>0)return`success`;if(e<0)return`error`}var Lt=class extends R{static properties={pnlPeriod:{state:!0}};constructor(){super(),this.pnlPeriod=`1Y`}performance=new U(this,async e=>{let[t,n]=await Promise.all([z(`/api/portfolio/period-stats`,{signal:e}),z(`/api/portfolio/pnl-history?period=${this.pnlPeriod}`,{signal:e})]);return{periodStats:t.period_stats,snapshots:n.snapshots,summary:n.summary}},{interval:3e5});createRenderRoot(){return this}renderValue(e,t){let n=It(e);return n?j`<tui-text variant=${n}>${t}</tui-text>`:j`<span>${t}</span>`}renderSummary(e){return j`
      <tui-flex wrap>
        <span style="white-space: nowrap"
          >Annualized&nbsp;${this.renderValue(e.actual_ann_return,G(e.actual_ann_return,2))}</span
        >
        <span style="white-space: nowrap"
          >&nbsp;│&nbsp;Target&nbsp;${this.renderValue(e.target_ann_return,G(e.target_ann_return,2))}</span
        >
      </tui-flex>
    `}renderTable(e){return j`
      <table
        aria-label="Portfolio performance by period"
        style="border-spacing: 0"
      >
        <thead>
          <tr>
            <th scope="col" style="text-align: left">Period&nbsp;&nbsp;</th>
            <th scope="col" style="text-align: right">P/L&nbsp;&nbsp;</th>
            <th scope="col" style="text-align: right">Return</th>
          </tr>
        </thead>
        <tbody>
          ${Nt.map(t=>{let n=e[t]??{};return j`
              <tr>
                <th scope="row" style="font: inherit; text-align: left">
                  ${t}&nbsp;&nbsp;
                </th>
                <td style="text-align: right">
                  ${this.renderValue(n.portfolio_eur,Ft(n.portfolio_eur))}&nbsp;&nbsp;
                </td>
                <td style="text-align: right">
                  ${this.renderValue(n.portfolio_pct,G(n.portfolio_pct,1))}
                </td>
              </tr>
            `})}
        </tbody>
      </table>
    `}changePeriod(e){this.pnlPeriod=e.currentTarget.value,this.performance.refresh()}renderControls(){return j`
      <tui-flex align="baseline" wrap>
        <span>Range&nbsp;</span>
        <tui-radio-buttonset
          aria-label="P/L chart period"
          value=${this.pnlPeriod}
          @change=${this.changePeriod}
        >
          <tui-radio-button value="3M">3M</tui-radio-button>
          <tui-radio-button value="6M">6M</tui-radio-button>
          <tui-radio-button value="1Y">1Y</tui-radio-button>
          <tui-radio-button value="ALL">ALL</tui-radio-button>
        </tui-radio-buttonset>
      </tui-flex>
    `}renderChartRow(e,t,n,r,i,a){let o=Number.isFinite(n)&&Number.isFinite(a)?n-a:void 0;return j`
      <tui-flex align="start">
        <span
          data-chart-space
          style="display: block; flex: 1 1 0; min-width: 0; white-space: nowrap"
          >${j`<tui-chart
      aria-label="${e} annualized return trend"
      height="4"
      min=${r}
      max=${i}
      threshold=${a??``}
      above-variant="success"
      below-variant="error"
      .values=${t}
    ></tui-chart>`}</span
        >
        <span style="white-space: nowrap"
          >&nbsp;${Number.isFinite(o)?this.renderValue(o,G(n,1)):G(n,1)}</span
        >
      </tui-flex>
    `}renderChart(e,t){if(!e||e.length<2)return j`<span>Not enough data yet</span>`;let n=e.map(e=>e.actual_ann_return===null?void 0:Number(e.actual_ann_return)),r=Number(t.target_ann_return),i=n.filter(Number.isFinite),a=Math.min(...i,r),o=Math.max(...i,r),s=Math.max(1,r-a,o-r)*1.2,c=r-s,l=r+s,u=Pt(n);return this.renderChartRow(`Actual`,n,u,c,l,r)}render(){let e;return e=this.performance.loading&&!this.performance.value?j`<span>Loading performance…</span>`:this.performance.error?j`<tui-text variant="error"
        >Portfolio P&amp;L unavailable</tui-text
      >`:!this.performance.value?.periodStats||!this.performance.value?.summary?j`<span>Not enough data yet</span>`:j`
        ${this.renderSummary(this.performance.value.summary)}
        ${this.renderControls()}
        ${this.renderChart(this.performance.value.snapshots,this.performance.value.summary)}
        ${this.renderTable(this.performance.value.periodStats)}
      `,j`<tui-box heading="Portfolio P&amp;L" border="single"
      >${e}</tui-box
    >`}};customElements.define(`sentinel-portfolio-pnl`,Lt);var Rt=class extends R{portfolio=new U(this,e=>z(`/api/portfolio`,{signal:e}),{interval:6e4});cashFlows=new U(this,e=>z(`/api/cashflows`,{signal:e}),{interval:3e5});createRenderRoot(){return this}renderCashBreakdown(e){let t=Object.entries(e??{}).filter(([,e])=>e!==0);return t.length===0?``:j`&nbsp;(${t.map(([e,t],n)=>j`${n>0?`, `:``}${e}&nbsp;${W(t,e)}`)})`}renderPortfolio(){let e=this.portfolio.value;return j`
      <tui-flex wrap>
        <span
          >Value&nbsp;<strong
            >${W(e.total_value_eur)}</strong
          ></span
        >
        <span aria-hidden="true">&nbsp;&nbsp;│&nbsp;&nbsp;</span>
        <span
          >Cash&nbsp;<strong>${W(e.total_cash_eur)}</strong>${this.renderCashBreakdown(e.cash)}</span
        >
      </tui-flex>
    `}renderCashFlows(){let e=this.cashFlows.value;if(!e)return``;let t=e.fees+e.taxes,n=e.total_profit>=0?`success`:`error`;return j`
      <tui-flex wrap>
        <span
          >Deposits&nbsp;<tui-text variant="success"
            >${W(e.deposits)}</tui-text
          ></span
        >
        <span aria-hidden="true">&nbsp;&nbsp;│&nbsp;&nbsp;</span>
        <span
          >Withdrawals&nbsp;<tui-text variant="error"
            >${W(e.withdrawals)}</tui-text
          ></span
        >
        <span aria-hidden="true">&nbsp;&nbsp;│&nbsp;&nbsp;</span>
        <span
          >Dividends&nbsp;<tui-text variant="success"
            >${W(e.dividends)}</tui-text
          ></span
        >
        <span aria-hidden="true">&nbsp;&nbsp;│&nbsp;&nbsp;</span>
        <span
          >Fees&nbsp;<tui-text variant="error"
            >${W(t)}</tui-text
          ></span
        >
        <span aria-hidden="true">&nbsp;&nbsp;—&nbsp;&nbsp;</span>
        <span
          >Total Profit&nbsp;<tui-text variant=${n}
            >${W(e.total_profit)}</tui-text
          ></span
        >
      </tui-flex>
    `}render(){let e;return e=this.portfolio.loading&&!this.portfolio.value?j`<span>Loading portfolio…</span>`:this.portfolio.error?j`<tui-text variant="error"
        >Portfolio unavailable</tui-text
      >`:this.renderPortfolio(),j`<section aria-label="Portfolio status">
      ${e}${this.renderCashFlows()}
    </section>`}};customElements.define(`sentinel-portfolio-status`,Rt);var zt=5,Bt=5;function Vt(e){let t=new Date(`${e}T00:00:00Z`);if(Number.isNaN(t.getTime()))return[];let n=Math.floor(t.getUTCFullYear()/Bt)*Bt+5,r=t.getUTCMonth(),i=t.getUTCDate();return Array.from({length:zt},(e,t)=>{let a=n+t*Bt,o=new Date(Date.UTC(a,r+1,0)).getUTCDate();return new Date(Date.UTC(a,r,Math.min(i,o)))})}function Ht(e,t){let n,r=1/0;for(let i of e){let e=Date.parse(`${i.date}T00:00:00Z`),a=Math.abs(e-t.getTime());Number.isFinite(e)&&a<r&&(n=i,r=a)}return n}var Ut=class extends R{projection=new U(this,e=>z(`/api/portfolio/value-projection?years=25`,{signal:e}),{interval:3e5});createRenderRoot(){return this}projectionRows(e){return Vt(e.summary.current_date).map(t=>{let n=Ht(e.projection,t);if(n)return{date:t,point:n,projectedNetDeposits:e.summary.current_net_deposits_eur+e.summary.avg_monthly_net_deposit_eur*n.months_ahead}}).filter(Boolean)}renderMetrics(e,t,n){let r=e.total_pnl_pct>=0?`success`:`error`,i=e.annualized_total_pnl_pct>=0?`success`:`error`;return j`
      <tui-flex wrap>
        <span style="white-space: nowrap">${t} to ${n}</span>
        <span style="white-space: nowrap"
          >&nbsp;&nbsp;P/L&nbsp;<tui-text variant=${r}
            >${G(e.total_pnl_pct,1)}</tui-text
          ></span
        >
        <span style="white-space: nowrap"
          >&nbsp;&nbsp;${e.deposit_window_months}M
          net/mo&nbsp;${W(e.avg_monthly_net_deposit_eur,`EUR`,0)}</span
        >
        <span style="white-space: nowrap"
          >&nbsp;&nbsp;Run-rate&nbsp;<tui-text variant=${i}
            >${G(e.annualized_total_pnl_pct,1)}</tui-text
          ></span
        >
      </tui-flex>
    `}renderTable(e){return e.length===0?j`<span>Not enough data yet</span>`:j`
      <table aria-label="Portfolio value projections" style="border-spacing: 0">
        <thead>
          <tr>
            <th scope="col" style="text-align: left">Year&nbsp;&nbsp;</th>
            <th scope="col" style="text-align: right">Value&nbsp;&nbsp;</th>
            <th
              scope="col"
              aria-label="Projected net deposits"
              style="text-align: right"
            >
              Net deposits
            </th>
          </tr>
        </thead>
        <tbody>
          ${e.map(({date:e,point:t,projectedNetDeposits:n})=>j`
              <tr>
                <th scope="row" style="font: inherit; text-align: left">
                  ${e.getUTCFullYear()}&nbsp;&nbsp;
                </th>
                <td style="text-align: right">
                  ${W(t.projected_value_eur,`EUR`,0)}&nbsp;&nbsp;
                </td>
                <td style="text-align: right">
                  ${W(n,`EUR`,0)}
                </td>
              </tr>
            `)}
        </tbody>
      </table>
    `}renderProjection(e){let t=this.projectionRows(e);if(t.length===0)return j`<span>Not enough data yet</span>`;let n=String(e.summary.start_date).slice(0,4),r=t.at(-1).date.getUTCFullYear();return j`${this.renderMetrics(e.summary,n,r)}
    ${this.renderTable(t)}`}render(){let e;return e=this.projection.loading&&!this.projection.value?j`<span>Loading projection…</span>`:this.projection.error?j`<tui-text variant="error"
        >Projection unavailable</tui-text
      >`:!this.projection.value?.summary||!this.projection.value?.projection?.length?j`<span>Not enough data yet</span>`:this.renderProjection(this.projection.value),j`<tui-box heading="Portfolio value" border="single"
      >${e}</tui-box
    >`}};customElements.define(`sentinel-portfolio-value`,Ut);var Wt=`ui_securities_table_columns`,Gt=[`price`,`security`,`value`,`pnl`,`ideal`,`plan`,`trade`];function Kt(e,t=1){let n=Number(e);return Number.isFinite(n)?`${n.toFixed(t)}%`:`-`}function Q(e,t=0){let n=Number(e);return Number.isFinite(n)?`${(n*100).toFixed(t)}%`:`-`}function qt(e){let t=Number(e);if(t>0)return`success`;if(t<0)return`error`}function Jt(e){let t=e.recommendation;return t?(t.action===`buy`?1:-1)*Math.abs(Number(t.value_delta_eur)||0):0}function $(e){return String(e).replaceAll(/[^a-zA-Z0-9_-]/g,`-`)}var Yt=class extends R{static properties={period:{state:!0},search:{state:!0},expandedSymbols:{state:!0},sortColumn:{state:!0},sortReversed:{state:!0},busyAction:{state:!0},message:{state:!0},errorMessage:{state:!0},addError:{state:!0},deleteCandidate:{state:!0},visibleColumns:{state:!0},columnsBusy:{state:!0},activeRowSymbol:{state:!0}};constructor(){super(),this.period=`1Y`,this.search=``,this.expandedSymbols=new Set,this.sortColumn=`priority`,this.sortReversed=!1,this.busyAction=``,this.message=``,this.errorMessage=``,this.addError=``,this.deleteCandidate=void 0,this.visibleColumns=void 0,this.columnsBusy=!1,this.activeRowSymbol=void 0}securities=new U(this,e=>z(`/api/unified?period=${this.period}`,{signal:e}),{interval:6e4});columnSettings=new U(this,e=>z(`/api/settings`,{signal:e}),{interval:0});createRenderRoot(){return this}get allSecurities(){return this.securities.value??[]}get visibleSecurities(){let e=this.search.trim().toLowerCase();return this.allSecurities.filter(t=>!e||[t.symbol,t.name,t.geography,t.industry].filter(Boolean).some(t=>String(t).toLowerCase().includes(e))).sort((e,t)=>{let n;switch(this.sortColumn){case`symbol`:n=String(e.symbol).localeCompare(String(t.symbol));break;case`value`:n=Number(e.value_eur||0)-Number(t.value_eur||0);break;case`pnl`:n=Number(e.profit_pct||0)-Number(t.profit_pct||0);break;case`ideal`:n=Number(e.ideal_allocation||0)-Number(t.ideal_allocation||0);break;case`recommendation`:n=Jt(e)-Jt(t);break;default:n=(e.recommendation?.execution_rank??1/0)-(t.recommendation?.execution_rank??1/0)||String(e.symbol).localeCompare(String(t.symbol))}return this.sortReversed?-n:n})}get selectedColumns(){let e=this.visibleColumns??this.columnSettings.value?.[Wt],t=Array.isArray(e)?e.filter(e=>Gt.includes(e)):[],n=new Set(t.length>0?t:Gt);return n.add(`security`),n}columnVisible(e){return this.selectedColumns.has(e)}activateRow(e){this.activeRowSymbol=e}deactivateRow(e){this.activeRowSymbol===e&&(this.activeRowSymbol=void 0)}rowFocusOut(e,t){e.currentTarget.contains(e.relatedTarget)||this.deactivateRow(t)}headingRowStyle(e){return this.activeRowSymbol!==e&&!this.expandedSymbols.has(e)?``:[`background:light-dark(black,white)`,`color:light-dark(white,black)`,`--tui-color:light-dark(white,black)`,`--tui-background:light-dark(black,white)`,`--tui-success-color:light-dark(white,black)`,`--tui-warning-color:light-dark(white,black)`,`--tui-error-color:light-dark(white,black)`].join(`;`)}get stats(){return{total:this.allSecurities.length,positions:this.allSecurities.filter(e=>e.has_position).length,buys:this.allSecurities.filter(e=>e.recommendation?.action===`buy`).length,sells:this.allSecurities.filter(e=>e.recommendation?.action===`sell`).length}}renderColored(e,t){let n=qt(e);return n?j`<tui-text variant=${n}>${t}</tui-text>`:t}changePeriod(e){this.period=e.currentTarget.value,this.securities.refresh()}changeSearch(e){this.search=e.currentTarget.value}changeSort(e){if(this.sortColumn===e){this.sortReversed=!this.sortReversed;return}this.sortColumn=e,this.sortReversed=!1}sortMarker(e){return this.sortColumn===e?this.sortReversed?`↓`:`↑`:`↕`}toggleExpanded(e){let t=new Set(this.expandedSymbols);t.has(e)?t.delete(e):t.add(e),this.expandedSymbols=t}toggleAll(){let e=this.visibleSecurities.map(e=>e.symbol),t=e.length>0&&e.every(e=>this.expandedSymbols.has(e));this.expandedSymbols=t?new Set:new Set(e)}updateLocalSecurity(e,t){this.securities.value=this.allSecurities.map(n=>n.symbol===e?{...n,...t}:n),this.requestUpdate()}async updatePermission(e,t,n){let r=+!!e.currentTarget.checked,i=t[n];this.errorMessage=``,this.message=``,this.updateLocalSecurity(t.symbol,{[n]:r});try{await B(`/api/securities/${encodeURIComponent(t.symbol)}`,{[n]:r}),this.message=`${t.symbol} ${n===`allow_buy`?`buy`:`sell`} permission updated`}catch(e){this.updateLocalSecurity(t.symbol,{[n]:i}),this.errorMessage=e.message}}async saveAliases(e){let t=this.querySelector(`#aliases-${$(e.symbol)}`);if(t){this.busyAction=`aliases:${e.symbol}`,this.errorMessage=``,this.message=``;try{await B(`/api/securities/${encodeURIComponent(e.symbol)}`,{aliases:t.value}),this.updateLocalSecurity(e.symbol,{aliases:t.value}),this.message=`${e.symbol} aliases updated`}catch(e){this.errorMessage=e.message}finally{this.busyAction=``}}}openAddDialog(){this.addError=``,this.querySelector(`#add-security-dialog`)?.showModal()}openColumnsDialog(){this.errorMessage=``,this.querySelector(`#columns-dialog`)?.showModal()}closeColumnsDialog(){this.querySelector(`#columns-dialog`)?.close()}async toggleColumn(e,t){let n=this.selectedColumns,r=new Set(n);if(e.currentTarget.checked?r.add(t):r.delete(t),r.size===0){e.currentTarget.setAttribute(`checked`,``),this.errorMessage=`At least one table column must remain visible`;return}let i=Gt.filter(e=>r.has(e));this.visibleColumns=i,this.columnsBusy=!0,this.errorMessage=``;try{await B(`/api/settings/${Wt}`,{value:i}),this.columnSettings.value={...this.columnSettings.value,[Wt]:i}}catch(e){this.visibleColumns=[...n],this.errorMessage=e.message}finally{this.columnsBusy=!1}}closeAddDialog(){this.querySelector(`#add-security-dialog`)?.close()}async addSecurity(e){e.preventDefault();let t=this.querySelector(`#add-security-symbol`),n=t?.value.trim().toUpperCase();if(!n){this.addError=`Symbol is required`;return}this.busyAction=`add`,this.addError=``;try{await V(`/api/securities`,{symbol:n}),this.closeAddDialog(),t.value=``,this.message=`${n} added`,await this.securities.refresh()}catch(e){this.addError=e.message}finally{this.busyAction=``}}async openDeleteDialog(e){this.deleteCandidate=e,this.errorMessage=``,await this.updateComplete,this.querySelector(`#delete-security-dialog`)?.showModal()}closeDeleteDialog(){this.querySelector(`#delete-security-dialog`)?.close()}async deleteSecurity(){let e=this.deleteCandidate;if(e){this.busyAction=`delete:${e.symbol}`,this.errorMessage=``;try{await H(`/api/securities/${encodeURIComponent(e.symbol)}?sell_position=false`),this.closeDeleteDialog(),this.expandedSymbols=new Set([...this.expandedSymbols].filter(t=>t!==e.symbol)),this.message=`${e.symbol} removed`,this.deleteCandidate=void 0,await this.securities.refresh()}catch(e){this.errorMessage=e.message}finally{this.busyAction=``}}}renderControls(){return j`
      <tui-flex align="baseline" wrap>
        <span>Period&nbsp;</span>
        <tui-radio-buttonset
          aria-label="Security price period"
          value=${this.period}
          @change=${this.changePeriod}
        >
          <tui-radio-button value="1M">1M</tui-radio-button>
          <tui-radio-button value="1Y">1Y</tui-radio-button>
          <tui-radio-button value="5Y">5Y</tui-radio-button>
          <tui-radio-button value="10Y">10Y</tui-radio-button>
        </tui-radio-buttonset>
        <span aria-hidden="true">&nbsp;│&nbsp;</span>
        <label>
          Search&nbsp;<tui-input
            type="search"
            aria-label="Search securities"
            placeholder="symbol or name"
            size="14"
            @input=${this.changeSearch}
          ></tui-input>
        </label>
        <span aria-hidden="true">&nbsp;│&nbsp;</span>
        <tui-button @click=${this.openColumnsDialog}>Columns</tui-button>
        <span aria-hidden="true">&nbsp;│&nbsp;</span>
        <tui-button @click=${this.openAddDialog}>Add Security</tui-button>
      </tui-flex>
    `}renderStats(){let e=this.stats;return j`
      <div>
        ${e.total} securities&nbsp;│&nbsp;${e.positions}
        positions&nbsp;│&nbsp;
        <tui-text variant="success">${e.buys} buy signals</tui-text
        >&nbsp;│&nbsp;
        <tui-text variant="error">${e.sells} sell signals</tui-text
        >&nbsp;│&nbsp; ${this.visibleSecurities.length} shown
      </div>
    `}renderSortableHeader(e,t){return j`
      <th
        scope="col"
        aria-sort=${this.sortColumn===t?this.sortReversed?`descending`:`ascending`:`none`}
        style="text-align: left; vertical-align: top"
      >
        <span aria-hidden="true">│&nbsp;</span
        ><tui-button @click=${()=>this.changeSort(t)}
          >${e}</tui-button
        ><span aria-hidden="true">${this.sortMarker(t)}</span>
      </th>
    `}renderRecommendation(e){let t=e.recommendation;return t?j`<tui-text variant=${t.action===`buy`?`success`:`error`}
      >${t.action.toUpperCase()}
      ${W(Math.abs(t.value_delta_eur),`EUR`)}</tui-text
    >`:j`<span>-</span>`}renderPriceSparkline(e){let t=(e.prices??[]).map(e=>Number(e.close)).filter(Number.isFinite);if(t.length<2)return`-`;let n=Number(e.avg_cost),r=!!e.has_position&&n>0,i=r?[...t,n]:t,a=Math.min(...i),o=Math.max(...i);return j`<tui-sparkline
      aria-label=${r?`${e.symbol} price history; green above and red below average purchase price`:`${e.symbol} price history; no position`}
      columns="8"
      min=${a}
      max=${o}
      threshold=${r?n:``}
      above-variant=${r?`success`:``}
      below-variant=${r?`error`:``}
      .values=${t}
    ></tui-sparkline>`}renderSecurityRow(e){let t=this.expandedSymbols.has(e.symbol),n=`security-${$(e.symbol)}-details`,r=Math.abs(e.post_plan_allocation-e.current_allocation)>.5,i=e.ideal_allocation-e.current_allocation;return j`
      <tr
        style=${this.headingRowStyle(e.symbol)}
        @mouseenter=${()=>this.activateRow(e.symbol)}
        @mouseleave=${()=>this.deactivateRow(e.symbol)}
        @focusin=${()=>this.activateRow(e.symbol)}
        @focusout=${t=>this.rowFocusOut(t,e.symbol)}
      >
        <td style="vertical-align: top">
          ${t?j`<tui-button
                  aria-label="Collapse ${e.symbol}"
                  aria-expanded="true"
                  aria-controls=${n}
                  @click=${()=>this.toggleExpanded(e.symbol)}
                  >−</tui-button
                >`:j`<tui-button
                  aria-label="Expand ${e.symbol}"
                  aria-expanded="false"
                  aria-controls=${n}
                  @click=${()=>this.toggleExpanded(e.symbol)}
                  >+</tui-button
                >`}
        </td>
        ${this.columnVisible(`price`)?j`<td style="vertical-align: top; white-space: nowrap">
                <span aria-hidden="true">│&nbsp;</span>
                ${this.renderPriceSparkline(e)}
              </td>`:``}
        <th
          scope="row"
          style="font: inherit; text-align: left; vertical-align: top; overflow-wrap: anywhere"
        >
          <span aria-hidden="true">│&nbsp;</span>
          ${e.price_warning?j`<tui-text variant="warning">!&nbsp;</tui-text>`:``}<span
            style="white-space: nowrap"
            >${e.symbol}</span
          >
        </th>
        ${this.columnVisible(`value`)?j`<td
                style="text-align: left; vertical-align: top; overflow-wrap: anywhere"
              >
                <span aria-hidden="true">│&nbsp;</span>
                ${e.has_position?W(e.value_eur,`EUR`,0):`-`}
              </td>`:``}
        ${this.columnVisible(`pnl`)?j`<td
                style="text-align: left; vertical-align: top; overflow-wrap: anywhere"
              >
                <span aria-hidden="true">│&nbsp;</span>
                ${e.has_position?j`${this.renderColored(e.profit_pct,G(e.profit_pct,1))}&nbsp;${this.renderColored(e.profit_value_eur,W(e.profit_value_eur,`EUR`,0))}`:`-`}
              </td>`:``}
        ${this.columnVisible(`ideal`)?j`<td style="text-align: left; vertical-align: top">
                <span aria-hidden="true">│&nbsp;</span>
                ${this.renderColored(i,Kt(e.ideal_allocation))}
              </td>`:``}
        ${this.columnVisible(`plan`)?j`<td
                style="text-align: left; vertical-align: top; overflow-wrap: anywhere"
              >
                <span aria-hidden="true">│&nbsp;</span>
                ${Kt(e.current_allocation)}
                ${r?j`&nbsp;→&nbsp;${this.renderColored(e.post_plan_allocation-e.current_allocation,Kt(e.post_plan_allocation))}`:``}
                <div>${this.renderRecommendation(e)}</div>
              </td>`:``}
        ${this.columnVisible(`trade`)?j`<td
                style="text-align: left; vertical-align: top; white-space: nowrap"
              >
                <span aria-hidden="true">│&nbsp;</span>
                <tui-toggle
                  aria-label="Allow buying ${e.symbol}"
                  ?checked=${e.allow_buy===1}
                  @change=${t=>this.updatePermission(t,e,`allow_buy`)}
                  >B</tui-toggle
                >&nbsp;<tui-toggle
                  aria-label="Allow selling ${e.symbol}"
                  ?checked=${e.allow_sell===1}
                  @change=${t=>this.updatePermission(t,e,`allow_sell`)}
                  >S</tui-toggle
                >
              </td>`:``}
      </tr>
      ${t?this.renderExpandedRow(e,n):``}
    `}renderDetailRow(e,t){return j`
      <tr>
        <th
          scope="row"
          style="font: inherit; text-align: left; vertical-align: top; white-space: nowrap; padding-right: 1ch"
        >
          ${e}
        </th>
        <td
          style="text-align: left; vertical-align: top; overflow-wrap: anywhere"
        >
          <span aria-hidden="true">│&nbsp;</span>${t}
        </td>
      </tr>
    `}renderPriceChart(e){let t=(e.prices??[]).map(e=>Number(e.close)).filter(Number.isFinite);if(t.length<2)return j`<div>No price data</div>`;let n=Number(e.avg_cost),r=!!e.has_position&&n>0,i=r?[...t,n]:t;return j`<tui-chart
      aria-label="${e.symbol} price history"
      height="6"
      min=${Math.min(...i)}
      max=${Math.max(...i)}
      threshold=${r?n:``}
      above-variant=${r?`success`:``}
      below-variant=${r?`error`:``}
      .values=${t}
    ></tui-chart>`}renderExpandedRow(e,t){let n=this.busyAction===`aliases:${e.symbol}`,r=Number(e.ai_research_multiplier);return j`
      <tr id=${t}>
        <td
          colspan=${this.selectedColumns.size+1}
          style="overflow-wrap: anywhere"
        >
          <tui-box border="single" aria-label="${e.symbol} details">
            ${this.renderPriceChart(e)}
            <table style="width: 100%; border-spacing: 0">
              <tbody>
                ${e.price_warning?this.renderDetailRow(`Warning`,j`<tui-text variant="warning"
                          >${e.price_warning}</tui-text
                        >`):``}
                ${this.renderDetailRow(`Geography`,e.geography||`-`)}
                ${this.renderDetailRow(`Industry`,e.industry||`-`)}
                ${this.renderDetailRow(`Lot`,e.min_lot??`-`)}
                ${this.renderDetailRow(`Quantity`,e.quantity??0)}
                ${this.renderDetailRow(`Price`,W(e.current_price,e.currency))}
                ${this.renderDetailRow(`Aliases`,j`<tui-input
                      id="aliases-${$(e.symbol)}"
                      aria-label="Aliases for ${e.symbol}"
                      value=${e.aliases??``}
                      size="28"
                    ></tui-input
                    >&nbsp;<tui-button
                      ?disabled=${n}
                      @click=${()=>this.saveAliases(e)}
                      >Save aliases</tui-button
                    >`)}
                ${this.renderDetailRow(`Forecast 4w`,this.renderColored(e.forecast_return_4w,Q(e.forecast_return_4w,1)))}
                ${this.renderDetailRow(`Timing`,Q(e.forecast_score))}
                ${this.renderDetailRow(`AI research`,Number.isFinite(r)?r.toFixed(2):`-`)}
                ${e.ai_research_multiplier_source?this.renderDetailRow(`Source`,e.ai_research_multiplier_source):``}
                ${e.ai_research_multiplier_updated_at?this.renderDetailRow(`Updated`,new Date(e.ai_research_multiplier_updated_at).toLocaleString()):``}
                ${e.ai_research_multiplier_analysis?this.renderDetailRow(`Analysis`,e.ai_research_multiplier_analysis):``}
                ${this.renderDetailRow(`Opportunity`,Q(e.opp_score,1))}
                ${this.renderDetailRow(`Dip`,Q(e.dip_score,1))}
                ${this.renderDetailRow(`Capitulation`,Q(e.capitulation_score,1))}
                ${this.renderDetailRow(`Cycle turn`,e.cycle_turn?`yes`:`no`)}
                ${this.renderDetailRow(`Freefall blocked`,e.freefall_block?`yes`:`no`)}
                ${e.recommendation?.reason?this.renderDetailRow(`Plan`,e.recommendation.reason):``}
                ${this.renderDetailRow(`Actions`,j`<tui-button
                    variant="error"
                    @click=${()=>this.openDeleteDialog(e)}
                    >Remove</tui-button
                  >`)}
              </tbody>
            </table>
          </tui-box>
        </td>
      </tr>
    `}renderTable(){let e=this.visibleSecurities,t=e.length>0&&e.every(e=>this.expandedSymbols.has(e.symbol));return e.length===0?j`<div>No securities match the current controls</div>`:j`
      <table aria-label="Securities" style="width: 100%; border-spacing: 0">
        <thead>
          <tr>
            <th scope="col" style="text-align: left; vertical-align: top">
              ${t?j`<tui-button
                      aria-label="Collapse all securities"
                      @click=${this.toggleAll}
                      >−</tui-button
                    >`:j`<tui-button
                      aria-label="Expand all securities"
                      @click=${this.toggleAll}
                      >+</tui-button
                    >`}
            </th>
            ${this.columnVisible(`price`)?j`<th
                    scope="col"
                    style="text-align: left; vertical-align: top"
                  >
                    <span aria-hidden="true">│&nbsp;</span>Price
                  </th>`:``}
            ${this.renderSortableHeader(`Security`,`symbol`)}
            ${this.columnVisible(`value`)?this.renderSortableHeader(`Value`,`value`):``}
            ${this.columnVisible(`pnl`)?this.renderSortableHeader(`P/L`,`pnl`):``}
            ${this.columnVisible(`ideal`)?this.renderSortableHeader(`Ideal`,`ideal`):``}
            ${this.columnVisible(`plan`)?this.renderSortableHeader(`Plan`,`recommendation`):``}
            ${this.columnVisible(`trade`)?j`<th
                    scope="col"
                    style="text-align: left; vertical-align: top"
                  >
                    <span aria-hidden="true">│&nbsp;</span>Trade
                  </th>`:``}
          </tr>
        </thead>
        <tbody>
          ${e.map(e=>this.renderSecurityRow(e))}
        </tbody>
      </table>
    `}renderColumnsDialog(){return j`
      <dialog
        id="columns-dialog"
        aria-label="Choose table columns"
        style="color: var(--tui-color); background: var(--tui-background); border: 0; padding: 0; max-width: calc(100% - 2ch)"
      >
        <tui-box heading="Columns" border="single">
          <div>
            <tui-toggle
              ?checked=${this.columnVisible(`price`)}
              ?disabled=${this.columnsBusy}
              @change=${e=>this.toggleColumn(e,`price`)}
              >Price</tui-toggle
            >
          </div>
          <div>
            <tui-toggle
              checked
              disabled
              aria-label="Security column is always visible"
              >Security</tui-toggle
            >
          </div>
          <div>
            <tui-toggle
              ?checked=${this.columnVisible(`value`)}
              ?disabled=${this.columnsBusy}
              @change=${e=>this.toggleColumn(e,`value`)}
              >Value</tui-toggle
            >
          </div>
          <div>
            <tui-toggle
              ?checked=${this.columnVisible(`pnl`)}
              ?disabled=${this.columnsBusy}
              @change=${e=>this.toggleColumn(e,`pnl`)}
              >P/L</tui-toggle
            >
          </div>
          <div>
            <tui-toggle
              ?checked=${this.columnVisible(`ideal`)}
              ?disabled=${this.columnsBusy}
              @change=${e=>this.toggleColumn(e,`ideal`)}
              >Ideal</tui-toggle
            >
          </div>
          <div>
            <tui-toggle
              ?checked=${this.columnVisible(`plan`)}
              ?disabled=${this.columnsBusy}
              @change=${e=>this.toggleColumn(e,`plan`)}
              >Plan</tui-toggle
            >
          </div>
          <div>
            <tui-toggle
              ?checked=${this.columnVisible(`trade`)}
              ?disabled=${this.columnsBusy}
              @change=${e=>this.toggleColumn(e,`trade`)}
              >Trade</tui-toggle
            >
          </div>
          ${this.errorMessage?j`<div>
                  <tui-text variant="error">${this.errorMessage}</tui-text>
                </div>`:``}
          <div>
            <tui-button @click=${this.closeColumnsDialog}>Done</tui-button>
          </div>
        </tui-box>
      </dialog>
    `}renderAddDialog(){return j`
      <dialog
        id="add-security-dialog"
        aria-label="Add Security"
        style="color: var(--tui-color); background: var(--tui-background); border: 0; padding: 0; max-width: calc(100% - 2ch)"
      >
        <tui-box heading="Add Security" border="single">
          <form @submit=${this.addSecurity}>
            <label>
              Symbol&nbsp;<tui-input
                id="add-security-symbol"
                aria-label="TraderNet security symbol"
                placeholder="AAPL.US"
                required
                ?disabled=${this.busyAction===`add`}
              ></tui-input>
            </label>
            <div>
              Geography and industry will be filled by the next metadata sync.
            </div>
            ${this.addError?j`<div><tui-text variant="error">${this.addError}</tui-text></div>`:``}
            <div>
              <tui-button type="submit" ?disabled=${this.busyAction===`add`}
                >Add Security</tui-button
              >&nbsp;
              <tui-button
                type="button"
                ?disabled=${this.busyAction===`add`}
                @click=${this.closeAddDialog}
                >Cancel</tui-button
              >
            </div>
          </form>
        </tui-box>
      </dialog>
    `}renderDeleteDialog(){let e=this.deleteCandidate;return j`
      <dialog
        id="delete-security-dialog"
        aria-label="Remove Security"
        style="color: var(--tui-color); background: var(--tui-background); border: 0; padding: 0; max-width: calc(100% - 2ch)"
      >
        <tui-box heading="Remove Security" border="single">
          ${e?j`
                  <div>Remove ${e.symbol} from the active universe?</div>
                  ${e.has_position?j`<div>
                          <tui-text variant="warning"
                            >Position: ${e.quantity} shares
                            (${W(e.value_eur,`EUR`)}). It
                            will remain managed, but new buys will be
                            disabled.</tui-text
                          >
                        </div>`:``}
                  ${this.errorMessage?j`<div>
                          <tui-text variant="error"
                            >${this.errorMessage}</tui-text
                          >
                        </div>`:``}
                  <div>
                    <tui-button
                      variant="error"
                      ?disabled=${this.busyAction===`delete:${e.symbol}`}
                      @click=${this.deleteSecurity}
                      >Remove</tui-button
                    >&nbsp;
                    <tui-button
                      ?disabled=${this.busyAction===`delete:${e.symbol}`}
                      @click=${this.closeDeleteDialog}
                      >Cancel</tui-button
                    >
                  </div>
                `:``}
        </tui-box>
      </dialog>
    `}render(){let e;return e=this.securities.loading&&!this.securities.value?j`<span>Loading securities…</span>`:this.securities.error?j`<tui-text variant="error"
        >Securities unavailable: ${this.securities.error.message}</tui-text
      >`:j`
        ${this.renderControls()} ${this.renderStats()}
        ${this.message?j`<div><tui-text variant="success">${this.message}</tui-text></div>`:``}
        ${this.errorMessage?j`<div><tui-text variant="error">${this.errorMessage}</tui-text></div>`:``}
        ${this.renderTable()}
      `,j`
      <tui-box heading="Securities" border="single">${e}</tui-box>
      ${this.renderColumnsDialog()} ${this.renderAddDialog()}
      ${this.renderDeleteDialog()}
    `}};customElements.define(`sentinel-securities`,Yt);var Xt=class extends R{static properties={selectedMode:{state:!0},modePending:{state:!0}};constructor(){super(),this.selectedMode=void 0,this.modePending=!1}version=new U(this,e=>z(`/api/version`,{signal:e}),{interval:0});health=new U(this,e=>z(`/api/health`,{signal:e}),{interval:3e4});markets=new U(this,e=>z(`/api/markets/status`,{signal:e}),{interval:6e4});refreshHealth=()=>this.health.refresh();connectedCallback(){super.connectedCallback(),window.addEventListener(`sentinel-setting-changed`,this.refreshHealth)}disconnectedCallback(){window.removeEventListener(`sentinel-setting-changed`,this.refreshHealth),super.disconnectedCallback()}createRenderRoot(){return this}get versionText(){return this.version.value?.version??`version unavailable`}renderBrokerStatus(){return this.health.error?j`<tui-text variant="error">broker: unavailable</tui-text>`:this.health.value?this.health.value.broker_connected?j`<tui-text variant="success">broker: connected</tui-text>`:j`<tui-text variant="error">broker: disconnected</tui-text>`:j`<span>broker: connecting</span>`}renderMarkets(){return this.markets.error||this.markets.value?.markets?.length===0?j`<tui-text variant="error">markets unavailable</tui-text>`:this.markets.value?this.markets.value.markets.map((e,t)=>j`
        ${t>0?j`<span aria-hidden="true">&nbsp;</span>`:``}
        <tui-text variant=${e.is_open?`success`:`error`}
          >${e.name}</tui-text
        >
      `):j`<span>markets loading</span>`}updated(){let e=this.health.value?.trading_mode;!this.modePending&&e&&e!==this.selectedMode&&(this.selectedMode=e)}async changeMode(e){let t=this.health.value?.trading_mode;this.selectedMode=e.currentTarget.value,this.modePending=!0;try{await B(`/api/settings/trading_mode`,{value:this.selectedMode}),await this.health.refresh()}catch(e){this.selectedMode=t,console.error(`Unable to update trading mode`,e)}finally{this.modePending=!1}}render(){return j`
      <footer>
        <tui-bar>
          <tui-flex align="baseline" justify="between" wrap>
            <span>Sentinel ${this.versionText}</span>
            <tui-flex align="baseline" wrap>
              <tui-radio-buttonset
                aria-label="Trading mode"
                value=${this.selectedMode??this.health.value?.trading_mode??`research`}
                ?disabled=${this.modePending}
                inverted
                @change=${this.changeMode}
              >
                <tui-radio-button value="research">Research</tui-radio-button>
                <tui-radio-button value="live">Live</tui-radio-button>
              </tui-radio-buttonset>
              <span aria-hidden="true">&nbsp;│&nbsp;</span>
              ${this.renderBrokerStatus()}
              <span aria-hidden="true">&nbsp;│&nbsp;</span>
              ${this.renderMarkets()}
            </tui-flex>
          </tui-flex>
        </tui-bar>
      </footer>
    `}};customElements.define(`sentinel-status-bar`,Xt);var Zt=class extends R{createRenderRoot(){return this}render(){return j`
      <tui-flex direction="column" style="height: 100dvh; overflow: hidden">
        <sentinel-header
          style="display: block; flex: 0 0 auto"
        ></sentinel-header>
        <main style="flex: 1 1 auto; min-height: 0; overflow: auto">
          <sentinel-portfolio-status
            style="display: block"
          ></sentinel-portfolio-status>
          <div aria-hidden="true">&nbsp;</div>
          <sentinel-planner-status
            style="display: block"
          ></sentinel-planner-status>
          <sentinel-portfolio-value
            style="display: block"
          ></sentinel-portfolio-value>
          <sentinel-portfolio-pnl
            style="display: block"
          ></sentinel-portfolio-pnl>
          <sentinel-securities style="display: block"></sentinel-securities>
        </main>
        <sentinel-status-bar
          style="display: block; flex: 0 0 auto"
        ></sentinel-status-bar>
      </tui-flex>
    `}};customElements.define(`sentinel-app`,Zt);export{X as t};