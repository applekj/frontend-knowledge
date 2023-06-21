const Item = props => {
  const {
    key,
    text,
    handlerRemove,
    itemStyle
  } = props;
  return createElement("li", {
    className: "item",
    style: itemStyle,
    key: key
  }, text, createElement("a", {
    href: "#",
    style: {
      color: '#000',
      marginLeft: '10px',
      cursor: 'pointer'
    },
    onClick: handlerRemove
  }, "X "));
};
class List extends Component {
  constructor(props) {
    super();
    this.state = {
      list: [{
        text: 'aaa',
        color: 'blue'
      }, {
        text: 'bbb',
        color: 'orange'
      }, {
        text: 'ccc',
        color: 'red'
      }],
      textColor: props.textColor
    };
  }
  handlerAdd() {
    this.setState({
      list: [...this.state.list, {
        text: this.ref.value
      }]
    });
  }
  handlerRemove(index) {
    const newList = this.state.list.filter((item, i) => i !== index);
    this.setState({
      list: newList
    });
  }
  render() {
    return createElement("div", null, createElement("ul", {
      className: "list"
    }, this.state.list.map((item, index) => createElement(Item, {
      key: index,
      text: item.text,
      itemStyle: {
        backgroundColor: item.color,
        color: this.state.textColor
      },
      handlerRemove: this.handlerRemove.bind(this, index)
    }))), createElement("div", null, createElement("input", {
      ref: element => {
        this.ref = element;
      }
    }), createElement("button", {
      onClick: this.handlerAdd.bind(this)
    }, "add")));
  }
}
render(createElement(List, {
  textColor: "pink"
}), document.querySelector('#root'));