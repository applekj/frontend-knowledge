class SyncHook {
    constructor(args) {
        this.args = args
        this.tasks = []
    }

    tap(name, task) {
        this.tasks.push(task)
    }

    call(...args) {
        if (this.args !== undefined) {
            this.args = [...args]
            this.tasks.forEach(task => task(...this.args))
        } else {
            this.tasks.forEach(task => task())
        }

    }
}

let hook = new SyncHook(['name'])

hook.tap('react', function (name) {
    console.log('react', name)
})

hook.tap('node', function (name) {
    console.log('node', name)
})

hook.call('yan')