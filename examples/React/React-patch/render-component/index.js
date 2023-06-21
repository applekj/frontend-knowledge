
// const list = [
//     {
//         text: 'aaa',
//         color: 'blue'
//     },
//     {
//         text: 'bbb',
//         color: 'orange'
//     },
//     {
//         text: 'ccc',
//         color: 'red'
//     }
// ]

// const List = (props) => <ul className='list'>
//     {props.list.map((item, index) => <li
//         className='item'
//         style={{ backgroundColor: item.color, color: '#fff' }}
//         key={index}
//         onClick={() => { alert(item.text) }}
//     >{item.text}</li>)}
// </ul>

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

    render() {
        return (
            <ul className='list'>
                {this.state.list.map((item, index) => <li
                    className='item'
                    style={{ backgroundColor: item.color, color: this.state.textColor }}
                    key={index}
                    onClick={() => { alert(item.text) }}
                >{item.text}</li>)}
            </ul>
        )
    }
}

render(<List textColor='pink' />, document.querySelector('#root'))