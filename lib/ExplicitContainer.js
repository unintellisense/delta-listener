"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var DeltaContainer_1 = require("./DeltaContainer");
var ExplicitContainer = (function (_super) {
    __extends(ExplicitContainer, _super);
    function ExplicitContainer() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ExplicitContainer.prototype.set = function (newData) {
        return;
    };
    return ExplicitContainer;
}(DeltaContainer_1.DeltaContainer));
exports.ExplicitContainer = ExplicitContainer;
//# sourceMappingURL=ExplicitContainer.js.map