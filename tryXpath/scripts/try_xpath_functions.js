
// namespace
if (!tryXpath) {
    var tryXpath = {};
}
tryXpath.functions = {};

(function (window, undefined) {
    "use strict";

    // alias
    var tx = tryXpath;
    var fu = tryXpath.functions;

    fu.execExpr = function(expr, method, opts) {
        opts = opts || {};
        var context = opts.context || document;
        var resolver = opts.resolver ? opts.resolver : null;
        var doc = opts.document || fu.getOwnerDocument(context) || context;

        var items, resultType;

        switch (method) {
        case "evaluate":
            if (!fu.isNodeItem(context) && !fu.isAttrItem(context)) {
                throw new Error("The context is either Nor nor Attr.");
            }
            resolver = fu.makeResolver(resolver);
            resultType = opts.resultType || XPathResult.ANY_TYPE;
            let result = doc.evaluate(expr, context, resolver, resultType,
                                      null);
            items = fu.resToArr(result, resultType);
            if (resultType === XPathResult.ANY_TYPE) {
                resultType = result.resultType;
            }
            break;

        case "querySelector":
            if (!fu.isDocOrElem(context)) {
                throw new Error("The context is either Document nor Element.");
            }
            let elem = context.querySelector(expr);
            items = elem ? [elem] : [];
            resultType = null;
            break;

        case "querySelectorAll":
        default:
            if (!fu.isDocOrElem(context)) {
                throw new Error(
                    "The context is neither Document nor Element.");
            }
            let elems = context.querySelectorAll(expr);
            items = fu.listToArr(elems);
            resultType = null;
            break;
        }

        return {
            "items": items,
            "method": method,
            "resultType": resultType
        };
    };

    fu.resToArr = function (res, type) {
        if (type === undefined || (type === XPathResult.ANY_TYPE)) {
            type = res.resultType;
        }

        var arr = [];
        switch(type) {
        case XPathResult.NUMBER_TYPE :
            arr.push(res.numberValue);
            break;
        case XPathResult.STRING_TYPE :
            arr.push(res.stringValue);
            break;
        case XPathResult.BOOLEAN_TYPE :
            arr.push(res.booleanValue);
            break;
        case XPathResult.ORDERED_NODE_ITERATOR_TYPE :
        case XPathResult.UNORDERED_NODE_ITERATOR_TYPE :
            for (var node = res.iterateNext()
                 ; node !== null
                 ; node = res.iterateNext()) {
                arr.push(node);
            }
            break;
        case XPathResult.ORDERED_NODE_SNAPSHOT_TYPE :
        case XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE :
            for (var i = 0; i < res.snapshotLength; i++) {
                arr.push(res.snapshotItem(i));
            }
            break;
        case XPathResult.ANY_UNORDERED_NODE_TYPE :
        case XPathResult.FIRST_ORDERED_NODE_TYPE :
            arr.push(res.singleNodeValue);
            break;
        default :
            throw new Error("The resultType is invalid. " + type);
        }
        return arr;
    };
    
    fu.makeResolver = function (obj) {
        if (obj === null) {
            return null;
        }
        if (typeof(obj) === "function") {
            return obj;
        }

        var dict;
        if (typeof(obj) === "string") {
            try {
                dict = JSON.parse(obj);
            } catch (e) {
                throw new Error("Invalid resolver. JSON syntax error. " + obj);
            }
        } else {
            dict = obj;
        }

        if (fu.isValidDict(dict)) {
            let map = fu.objToMap(dict);
            return function (str) {
                if (map.has(str)) {
                    return map.get(str);
                }
                return "";
            };
        }
        throw new Error("Invalid resolver. "
                        + JSON.stringify(dict, null));
    };

    fu.isValidDict = function (obj) {
        if ((obj === null) || (typeof(obj) !== "object")) {
            return false;
        }
        for (var key of Object.keys(obj)) {
            if (typeof(obj[key]) !== "string") {
                return false;
            }
        }
        return true;
    };

    fu.objToMap = function (obj) {
        var map = new Map();
        Object.keys(obj).forEach(function(item) {
            map.set(item, obj[item]);
        });
        return map;
    }

    fu.isDocOrElem = function(obj) {
        if ((obj.nodeType === 1) || (obj.nodeType === 9)) {
            return true;
        }
        return false;
    }

    fu.listToArr = function(list) {
        var elems = [];
        for (var i = 0; i < list.length; i++) {
            elems.push(list[i]);
        }
        return elems;
    }

    fu.getItemDetail = function (item) {
        var typeStr = typeof(item);

        if (typeStr === "string") {
            return { "type": "String", "name": "", "value": item };
        }
        if (typeStr === "number") {
            return { "type": "Number", "name": "", "value": item.toString() };
        }

        // item is Attr
        if (fu.isAttrItem(item)) {
            return { "type": "Attr", "name": item.name, "value": item.value };
        }

        // item is Node
        return {
            "type": "Node " + fu.getNodeTypeStr(item.nodeType) + "(nodeType="
                + item.nodeType + ")",
            "name": item.nodeName,
            "value": item.nodeValue || ""
        };
    }

    fu.getItemDetails = function (items) {
        var details = [];
        for (var i = 0; i < items.length; i++) {
            details.push(fu.getItemDetail(items[i]));
        }
        return details;
    }

    const nodeTypeMap = new Map([
        [Node.ELEMENT_NODE, "ELEMENT_NODE"],
        [Node.ATTRIBUTE_NODE, "ATTRIBUTE_NODE"],
        [Node.TEXT_NODE, "TEXT_NODE"],
        [Node.CDATA_SECTION_NODE, "CDATA_SECTION_NODE"],
        [Node.ENTITY_REFERENCE_NODE, "ENTITY_REFERENCE_NODE"],
        [Node.ENTITY_NODE, "ENTITY_NODE"],
        [Node.PROCESSING_INSTRUCTION_NODE, "PROCESSING_INSTRUCTION_NODE"],
        [Node.COMMENT_NODE, "COMMENT_NODE"],
        [Node.DOCUMENT_NODE, "DOCUMENT_NODE"],
        [Node.DOCUMENT_TYPE_NODE, "DOCUMENT_TYPE_NODE"],
        [Node.DOCUMENT_FRAGMENT_NODE, "DOCUMENT_FRAGMENT_NODE"],
        [Node.NOTATION_NODE, "NOTATION_NODE"]
    ]);

    fu.getNodeTypeStr = function(nodeType) {
        if (nodeTypeMap.has(nodeType)) {
            return nodeTypeMap.get(nodeType);
        }
        return "Unknown";
    }

    const xpathResultMap = new Map([
        [XPathResult.ANY_TYPE, "ANY_TYPE"],
        [XPathResult.NUMBER_TYPE , "NUMBER_TYPE"],
        [XPathResult.STRING_TYPE , "STRING_TYPE"],
        [XPathResult.BOOLEAN_TYPE , "BOOLEAN_TYPE"],
        [XPathResult.UNORDERED_NODE_ITERATOR_TYPE ,
         "UNORDERED_NODE_ITERATOR_TYPE"],
        [XPathResult.ORDERED_NODE_ITERATOR_TYPE ,
         "ORDERED_NODE_ITERATOR_TYPE"],
        [XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE ,
         "UNORDERED_NODE_SNAPSHOT_TYPE"],
        [XPathResult.ORDERED_NODE_SNAPSHOT_TYPE ,
         "ORDERED_NODE_SNAPSHOT_TYPE"],
        [XPathResult.ANY_UNORDERED_NODE_TYPE, "ANY_UNORDERED_NODE_TYPE"],
        [XPathResult.FIRST_ORDERED_NODE_TYPE, "FIRST_ORDERED_NODE_TYPE"]
    ]);

    fu.getXpathResultStr = function (resultType) {
        if (xpathResultMap.has(resultType)) {
            return xpathResultMap.get(resultType);
        }
        return "Unknown";
    };

    fu.isAttrItem = function (item) {
        return Object.prototype.toString.call(item) === "[object Attr]";
    }

    fu.isNodeItem = function (item) {
        if (fu.isAttrItem(item)) {
            return false;
        }

        switch (typeof(item)) {
        case "string":
        case "number":
            return false;
        default:
            return true;
        }
    }
    
    fu.isElementItem = function (item) {
        if (fu.isNodeItem(item)
            && (item.nodeType === Node.ELEMENT_NODE)) {
            return true;
        }
        return false;
    }

    fu.addClassToItem = function (clas, item) {
        if (fu.isElementItem(item)) {
            item.classList.add(clas);
        }
    }

    fu.addClassToItems = function (clas, items) {
        for (var item of items) {
            fu.addClassToItem(clas, item);
        }
    }

    fu.saveItemClass = function (item) {
        if (!fu.isElementItem(item)) {
            return null;
        }

        var clas;
        if (item.hasAttribute("class")) {
            clas = item.getAttribute("class");
        } else {
            clas = null;
        }
        return {
            "elem": item,
            "origClass": clas
        }
    }

    fu.restoreItemClass = function (savedClass) {
        if (savedClass === null) {
            return null;
        }

        if (savedClass.origClass === null) {
            savedClass.elem.removeAttribute("class");
        } else {
            savedClass.elem.setAttribute("class", savedClass.origClass);
        }
    }

    fu.saveItemClasses = function (items) {
        var savedClasses = [];
        for (var item of items) {
            savedClasses.push(fu.saveItemClass(item));
        }
        return savedClasses;
    }

    fu.restoreItemClasses = function (savedClasses) {
        for (var savedClass of savedClasses) {
            fu.restoreItemClass(savedClass);
        }
    }

    fu.getParentElement = function (item) {
        if (fu.isAttrItem(item)) {
            let parent = item.ownerElement;
            return parent ? parent : null;
        }

        if (fu.isNodeItem(item)) {
            let parent = item.parentElement;
            if (parent) {
                return parent;
            }
            parent = item.parentNode;
            if (parent && (parent.nodeType === Node.ELEMENT_NODE)) {
                return parent;
            }
        }
        return null;
    };

    fu.getOwnerDocument = function (item) {
        if (fu.isAttrItem(item)) {
            let elem = item.ownerElement;
            if (elem) {
                return elem.ownerDocument;
            }
            return item.ownerDocument;
        }

        if (fu.isNodeItem(item)) {
            return item.ownerDocument;
        }

        return null;
    };

    fu.createDetailTableHeader = function (opts) {
        opts = opts || {};
        var doc = opts.document || document;

        var tr = doc.createElement("tr");
        var th = doc.createElement("th");
        th.textContent = "Index";
        tr.appendChild(th);
        
        th = doc.createElement("th");
        th.textContent = "Type";
        tr.appendChild(th);

        th = doc.createElement("th");
        th.textContent = "Name";
        tr.appendChild(th);

        th = doc.createElement("th");
        th.textContent = "Value";
        tr.appendChild(th);

        th = doc.createElement("th");
        th.textContent = "Focus";
        tr.appendChild(th);

        return tr;
    };

    fu.appendDetailRows = function (parent, details, opts) {
        opts = opts || {};
        var doc = opts.document || document;
        var chunkSize = opts.chunkSize || 1000;
        var callback = opts.callback ? opts.callback : null;

        var index = 0;

        function processChunk() {
            var frag = doc.createDocumentFragment();
            for (var i = 0
                 ; (i < chunkSize) && (index < details.length)
                 ; i++, index++) {
                var detail = details[index];
                var tr = doc.createElement("tr");

                var td = doc.createElement("td");
                td.textContent = index;
                tr.appendChild(td);

                td = doc.createElement("td");
                td.textContent = detail.type;
                tr.appendChild(td);

                td = doc.createElement("td");
                td.textContent = detail.name;
                tr.appendChild(td);

                td = doc.createElement("td");
                td.textContent = detail.value;
                tr.appendChild(td);

                td = doc.createElement("td");
                var button = doc.createElement("button");
                button.textContent = "Focus";
                button.setAttribute("data-index", index);
                td.appendChild(button);
                tr.appendChild(td);

                frag.appendChild(tr);
            }
            parent.appendChild(frag);
            if (index < details.length) {
                window.setTimeout(processChunk, 0);
            } else {
                if (callback) { callback(); }
            }
        };

        window.setTimeout(processChunk, 0);
    };

})(window);
