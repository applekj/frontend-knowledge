//配合@babel/preset-react生成vdom
const createElement = (type, props, ...children) => {
    props = props || {}
    return {
        type,
        props,
        children
    }
}

//判断是否文本节点，vdom是字符串或者数字
const isTextVdom = vdom => {
    return typeof vdom === 'string' || typeof vdom === 'number'
}

/* 
 * 判断vdom是否DOM元素节点
 * @vdom  
 * { 
 *     type:'ul'，// DOM标签名
 *     props:{} , //DOM元素的属性
 *     children:[] , // DOM元素的子元素
 * }
 */
const isElementVdom = vdom => {
    return typeof vdom === 'object' && typeof vdom.type === 'string'
}

//判断vdom是否组件
const isComponentVdom = vdom => {
    return typeof vdom.type === 'function'
}

//给dom元素绑定属性，区分事件、style、ref、（checked、value、className）
const setAttributes = (dom, key, value) => {
    //属性为事件的情况
    if (typeof value === 'function' && key.startsWith('on')) {
        const eventType = key.slice(2).toLowerCase()
        dom.__handlers = dom.__handlers || {}
        dom.removeEventListener(eventType, dom.__handlers[eventType])
        dom.__handlers[eventType] = value
        dom.addEventListener(eventType, dom.__handlers[eventType])
    } else if (typeof value === 'object' && key === 'style') {
        Object.assign(dom.style, value)
    } else if (key === 'ref' && typeof value === 'function') {
        value(dom)
    } else if (key === 'value' || key === 'checked' || key === 'className') {
        dom[key] = value
    } else if (typeof value !== 'object' && typeof value !== 'function') {
        dom.setAttribute(key, value)
    }
}

class Component {
    constructor(props) {
        this.state = null
        this.props = props || {}
    }

    setState(nextState) {
        this.state = Object.assign(this.state, nextState)
        if (this.dom && this.shouldComponentUpdate(this.props, nextState)) {
            patch(this.dom, this.render()) //patch更新 this.render()表示vdom，因为state改变，this.render()也改变
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        return nextProps !== this.props || nextState !== this.state
    }

    componentWillMount() { }

    componentDidMount() { }

    componentWillUnMount() { }

    componentWillRecevieProps() { }
}

//renderComponent逻辑 ,区分class组件 、函数组件
const renderComponent = (vdom, parent) => {
    const props = Object.assign({}, vdom.props, { children: vdom.children })

    if (Component.isPrototypeOf(vdom.type)) { //class组件的逻辑
        const instance = new vdom.type(props)
        instance.componentWillMount()
        const componentVdom = instance.render()
        instance.dom = render(componentVdom, parent)
        instance.dom.__instance = instance //用来判断是否同一组件
        instance.dom.__key = vdom.props.key //在更新节点时，加上标识，看是否跟新，尽量重用，减少DOM渲染
        instance.componentDidMount()
        return instance.dom
    } else { //函数组件的情况
        const componentVdom = vdom.type(props)
        return render(componentVdom, parent)
    }
}

//patch更新逻辑，区分组件、文本节点、同一元素节点、不同元素节点 dom表示组件的render()，真实的dom
const patch = (dom, vdom, parent = dom.parentNode) => {
    //使用replaceChild替换
    const replace = parent ? el => {
        parent.replaceChild(el, dom)
    } : el => el
    let newDom = dom
    if (isComponentVdom(vdom)) { //判断vdom是否组件
        const props = Object.assign({}, vdom.props, { children: vdom.children })
        if (dom.__instance && dom.__instance.constructor === vdom.type) { //相同组件，patch更新子元素
            dom.__instance.componentWillRecevieProps(props)
            dom.__instance.props = props //这里加上props，在下次时能拿到props，避免丢失props
            newDom = patch(dom, dom.__instance.render(), parent)
        } else if (Component.isPrototypeOf(vdom.type)) { //不相同组件，class组件的情况，直接替换
            const componentDom = renderComponent(vdom, parent)
            replace(componentDom)
            newDom = componentDom
        } else if (!Component.isPrototypeOf(vdom.type)) { //不相同组件，函数组件的情况，直接替换
            newDom = patch(dom, vdom.type(props), parent)
        }
    } else if (dom instanceof Text) { //判断dom是否文本节点
        //如果文本节点改动为其他DOM元素节点，或文本内容更改，直接更新
        if (typeof vdom === 'object' || dom.textContent !== vdom) {
            replace(render(vdom, parent))
        } else {
            newDom = dom
        }
    } else if (dom.nodeName !== vdom.type.toUpperCase() && typeof vdom === 'object') { //判断dom是否DOM元素，且dom的类型与vdom的类型不一致，直接替换
        newDom = render(vdom, parent)
        replace(newDom)
    } else if (dom.nodeName === vdom.type.toUpperCase() && typeof vdom === 'object') { //判断dom是否DOM元素，且dom的类型与vdom的类型一致
        const active = document.activeElement
        const oldDoms = {}
        new Array().concat(...dom.childNodes).map((child, index) => {
            const key = child.__key || `__index_${index}`
            oldDoms[key] = child
        })
        new Array().concat(...vdom.children).map((child, index) => {
            const key = child.props && child.props.key || `__index_${index}`
            dom.appendChild(oldDoms[key] ? patch(oldDoms[key], child) : render(child, dom))
            delete oldDoms[key]
        })
        for (const key in oldDoms) {
            const instance = oldDoms[key].__instance
            if (instance) {
                instance.componentWillUnMount()
            }
            oldDoms[key].remove()
        }
        for (const attr of dom.attributes) {
            dom.removeAttribute(attr.name)
        }
        for (const prop in vdom.props) {
            setAttributes(dom, prop, vdom.props[prop])
        }
        active.focus()
    }
    return newDom
}

const render = (vdom, parent = null) => {
    //将vdom挂载到parent节点上
    const mount = parent ? (el => parent.appendChild(el)) : (el => el)

    let dom = null
    //判断节点类型，文本节点用createTextNode，元素节点用createElement，如果是组件，则走renderComponent逻辑
    if (isTextVdom(vdom)) {
        dom = mount(document.createTextNode(vdom))
    } else if (isElementVdom(vdom)) {
        dom = mount(document.createElement(vdom.type))
        //dom元素上绑定属性
        for (const prop in vdom.props) {
            setAttributes(dom, prop, vdom.props[prop])
        }
        //渲染dom的子元素
        for (const child of [].concat(...vdom.children)) {
            render(child, dom)
        }
    } else if (isComponentVdom(vdom)) {
        dom = renderComponent(vdom, parent)
    }
    return dom
}