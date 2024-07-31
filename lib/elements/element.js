/**
 * Abstract Element present on the web page. Extra methods are available based on the element type.
 * @see {ElementWrapper} for methods available
 */

class Element {
  constructor(objectId, description, runtimeHandler) {
    this.objectId = objectId;
    this.description = description;
    this.runtimeHandler = runtimeHandler;
  }
  get() {
    return this.objectId;
  }

  async text() {
    const getText = function () {
      if (this.nodeType === Node.TEXT_NODE) {
        return this.parentElement.innerText;
      } else {
        return this.innerText;
      }
    };
    const result = await this.runtimeHandler.runtimeCallFunctionOn(
      getText,
      null,
      {
        objectId: this.objectId,
      },
    );
    return result.result.value;
  }

  async getAttribute(value) {
    function getAttribute(value) {
      return this.getAttribute(value);
    }
    const result = await this.runtimeHandler.runtimeCallFunctionOn(
      getAttribute,
      null,
      {
        objectId: this.objectId,
        arg: value,
      },
    );
    return result.result.value;
  }

  static create(objectIds, runtimeHandler) {
    return objectIds.map(
      (objectId) => new Element(objectId, "", runtimeHandler),
    );
  }

  async _executeAndGetValue(callback) {
    const { result } = await this.runtimeHandler.runtimeCallFunctionOn(
      callback,
      null,
      {
        objectId: this.objectId,
        returnByValue: true,
      },
    );
    if (result.value === undefined) {
      return false;
    }
    return result.value;
  }

  async isVisible() {
    function isHidden() {
      let elem = this;
      if (this.nodeType === Node.TEXT_NODE) {
        elem = this.parentElement;
      }
      return !(
        elem.offsetHeight ||
        elem.offsetWidth ||
        elem.getClientRects().length
      );
    }
    const result = await this.runtimeHandler.runtimeCallFunctionOn(
      isHidden,
      null,
      {
        objectId: this.objectId,
        returnByValue: true,
      },
    );
    return !result.result.value;
  }

  async isWritable() {
    function getDetailsForWrittable() {
      return {
        tagName: this.tagName,
        isContentEditable: this.isContentEditable,
        disabled: this.disabled,
        type: this.type,
        readOnly: this.readOnly,
      };
    }

    let editable, disabled;
    const result = await this.runtimeHandler.runtimeCallFunctionOn(
      getDetailsForWrittable,
      null,
      {
        objectId: this.objectId,
        returnByValue: true,
      },
    );
    const activeElementDetails = result ? result.result.value : undefined;
    if (activeElementDetails) {
      editable =
        !activeElementDetails.readOnly &&
        (["INPUT", "TEXTAREA", "SELECT"].includes(
          activeElementDetails.tagName,
        ) ||
          activeElementDetails.isContentEditable);
      disabled = activeElementDetails.disabled;
      return !(!editable || disabled);
    }
  }

  async isDisabled() {
    function isDisabled() {
      if (this.nodeType === Node.ELEMENT_NODE) {
        return this.parentElement.disabled || this.disabled;
      }
    }
    return await this._executeAndGetValue(isDisabled);
  }

  async isConnected() {
    function isConnected() {
      return (
        (this.parentElement && this.parentElement.isConnected) ||
        this.isConnected
      );
    }
    return await this._executeAndGetValue(isConnected);
  }

  async isPassword() {
    function isPassword() {
      return this.type === "password";
    }
    return await this._executeAndGetValue(isPassword);
  }

  async isDraggable() {
    function isDraggable() {
      return (
        (this.parentElement && this.parentElement.draggable) || this.draggable
      );
    }
    return await this._executeAndGetValue(isDraggable);
  }

  async registerNativeValueSetter() {
    function defineNativeSetterProperty() {
      const setNativeValue = (element, propName, value) => {
        const { set: valueSetter } =
          Object.getOwnPropertyDescriptor(element, propName) || {};
        const prototype = Object.getPrototypeOf(element);
        const { set: prototypeValueSetter } =
          Object.getOwnPropertyDescriptor(prototype, propName) || {};

        if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
          prototypeValueSetter.call(element, value);
        } else if (valueSetter) {
          valueSetter.call(element, value);
        } else {
          throw new Error("The given element does not have a value setter");
        }
      };

      if (typeof this.setNativeValue === "undefined") {
        Object.defineProperty(this.constructor.prototype, "setNativeValue", {
          configurable: true,
          enumerable: false,
          value: setNativeValue,
        });
      }
    }

    await this.runtimeHandler.runtimeCallFunctionOn(
      defineNativeSetterProperty,
      null,
      {
        objectId: this.get(),
      },
    );
  }
}

module.exports = Element;
