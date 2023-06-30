const trap = (arr: number[]): number => {
    let result = 0
    const stack: number[] = []
    let p = 0
    while (p < arr.length) {
        while (stack.length && arr[p] > arr[stack[stack.length - 1]]) {
            const top = stack.pop() as number
            if (stack.length) {
                const width = p - stack[stack.length - 1] - 1
                const height = Math.min(arr[p], arr[stack[stack.length - 1]]) - arr[top]
                result += width * height
            }
        }
        stack.push(p)
        p++
    }
    return result
}

console.log(trap([4, 2, 0, 3, 2, 5]))
