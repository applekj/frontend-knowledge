//匹配任何字符

//测试？？
var string = 'ac abc'
var regex = /ab??c/

var result = string.match(regex)


// //匹配16进制颜色
// var string = '#ffbbad #Fc01DF #FFF #ffE #ffEd'
// var regex = /#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})/g
// var result = string.match(regex)

console.log(result)
