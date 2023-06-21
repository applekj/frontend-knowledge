const data = {
    b: 'bbb',
    c: 'ccc',
};

// const App = (props) => {
//     const [count, setCount] = useState(1)
//     return (
//         <ul className="list">
//             <li
//                 className="item"
//                 style={{ background: 'blue', color: '#fff' }}
//                 onClick={e => {
//                     alert(1)
//                 }}
//             >
//                 aaa
//             </li>
//             <li className="item">{data.b}</li>
//             <li className="item">{data.c}</li>
//             <li className="item">
//                 <button onClick={() => { setCount(count + 1) }}>+</button>
//                 <span style={{ width: '100px', display: 'inline-block' }}>{count}</span>
//                 <button onClick={() => { setCount(count - 1) }}>-</button>
//             </li>
//         </ul >
//     )
// };

class App extends Component {
    constructor(props) {
        super()
        this.props = props
        this.state = {
            count: 1
        }
    }

    render() {
        return (
            <ul className="list">
                <li
                    className="item"
                    style={{ background: 'blue', color: '#fff' }}
                    onClick={e => {
                        alert(1)
                    }}
                >
                    aaa
                </li>
                <li className="item">{data.b}</li>
                <li className="item">{data.c}</li>
                <li className="item">
                    <button onClick={() => { this.setState({ count: this.state.count + 1 }) }}>+</button>
                    <span style={{ width: '100px', display: 'inline-block' }}>{this.state.count}</span>
                    <button onClick={() => { this.setState({ count: this.state.count - 1 }) }}>-</button>
                </li>
            </ul >
        )
    }
}

render(<App name='test' />, document.querySelector('#root'))