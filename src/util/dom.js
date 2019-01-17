export default {
  copyElement(id) {
    let el = document.getElementById(id)
    let parent = el.parentElement
    let elCopy = el.cloneNode(true)
    parent.append(elCopy)
    return elCopy
  }
}
