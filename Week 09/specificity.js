function specificity(selector) {
    const p = [0, 0, 0, 0]
    const selectorParts = selector.split(' ')
    for (const part of selectorParts) {
        const ids = part.match(/\#\w+/g)
        const classes = part.match(/\.\w+/g)
        if (ids) {
            p[1] += ids.length
        }
        if (classes) {
            p[2] += classes.length
        }

        if (part.charAt(0) !== '#' && part.charAt(0) !== '.') {
            p[3] += 1
        }
    }
    return p
}