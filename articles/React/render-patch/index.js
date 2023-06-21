const Item = props => {
    const { key, text, handlerRemove, itemStyle } = props
    return (
        <li className='item' style={itemStyle} key={key}>
            {text}
            <a href='#' style={{ color: '#000', marginLeft: '10px', cursor: 'pointer' }} onClick={handlerRemove}>X </a>
        </li>
    )
}


class List extends Component {
    constructor(props) {
        super()
        this.state = {
            list: [
                {
                    text: 'aaa',
                    color: 'blue'
                },
                {
                    text: 'bbb',
                    color: 'orange'
                },
                {
                    text: 'ccc',
                    color: 'red'
                }
            ],
            textColor: props.textColor
        }
    }

    handlerAdd() {
        this.setState({
            list: [
                ...this.state.list,
                {
                    text: this.ref.value
                }
            ]
        })
    }

    handlerRemove(index) {
        const newList = this.state.list.filter((item, i) => i !== index)
        this.setState({
            list: newList
        })
    }

    render() {
        return (
            <div>
                <ul className='list'>
                    {this.state.list.map((item, index) => <Item
                        key={index}
                        text={item.text}
                        itemStyle={{ backgroundColor: item.color, color: this.state.textColor }}
                        handlerRemove={this.handlerRemove.bind(this, index)}
                    />)}
                </ul>
                <div>
                    <input ref={element => { this.ref = element }} />
                    <button onClick={this.handlerAdd.bind(this)}>add</button>
                </div>
            </div>

        )
    }
}

render(<List textColor='pink' />, document.querySelector('#root'))