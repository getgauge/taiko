'use strict';
const {
    link, comboBox,inputField,text,$
} = require('taiko');

function getElementWithSelector(element,selector){
    var selectedElement = null
    var selectedItem
    try{
        selectedItem =  JSON.parse(selector)
    }
    catch(err)
    {
        selectedItem = selector
    }
    switch(element){
        case "link":
            selectedElement = link(selectedItem)
            break;
        case "inputField":
            selectedElement = inputField(selectedItem)
            break;
        case "text":
            selectedElement = text(selectedItem)
            break;
        case "$":
            selectedElement = $(selectedItem)
            break;
    }
    return selectedElement
}

function getElement(table){
    var referenceElement = null
    table.rows.forEach(function (row) {
        referenceElement = getElementWithSelector(row.cells[0],row.cells[1])
        if(row.cells[2])
        {
            return referenceElement[row.cells[2]]()
        }
    })
    return referenceElement
}

module.exports={
    getElement:getElement
}