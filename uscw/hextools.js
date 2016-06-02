/**
 * Created by HDA3014 on 24/01/2016.
 */

exports.Hex = function(svg) {

    var MARGIN = 30;
    var REDUCTION_FACTOR = 2 / 3;
    var SECOND_REDUCTION_FACTOR = 9 / 10;
    var LINE_ENLARGE_FACTOR = 0.3;
    var LINE_CONTROL_FACTOR = 0.5;
    var HEX_WIDTH = 51;
    var ALL_DIRECTIONS = ["ne", "e", "se", "sw", "w", "nw"];

    function makeOrdered(ordered) {
        ordered = ordered || [];
        var order = {};
        for (var i = 0; i < ordered.length; i++) {
            order[ordered[i]] = i;
        }
        return order;
    }

    function rotate(x, y, angle) {
        angle = angle / 180 * Math.PI;
        return {
            x: Math.round(x * Math.cos(angle) - y * Math.sin(angle)),
            y: Math.round(x * Math.sin(angle) + y * Math.cos(angle))
        }
    }

    function inverseDirection(direction) {
        switch (direction) {
            case "ne":
                return "sw";
            case "e":
                return "w";
            case "se":
                return "nw";
            case "sw":
                return "ne";
            case "w":
                return "e";
            case "nw":
                return "se";
        }
    }

    function isEmpty(coll) {
        var result = true;
        for (var d in ALL_DIRECTIONS) {
            result &= coll[ALL_DIRECTIONS[d]] === undefined;
        }
        return result;
    }

    class Map {

        constructor(colCount, rowCount, width, ordered, background) {
            this.hexWidth = width;
            this.rowCount = rowCount;
            this.colCount = colCount;
            this.rows = [];
            this.hexes = [];
            this.hexSupport = new svg.Translation();
            this.itemSupport = new svg.Translation();
            this.component = new svg.Translation();
            this.component.width = (colCount * 2 + 1) * svg.Hexagon.height(width) + MARGIN * 2;
            this.component.height = (rowCount * 3 + 1) / 2 * width + MARGIN * 2;
            this.component
                .add(new svg.Rect(this.component.width, this.component.height)
                    .position(this.component.width / 2, this.component.height / 2).color(background))
                .add(this.hexSupport).add(this.itemSupport);
            this._createHexes(rowCount, colCount, width, ordered);
            this._linkHexes(rowCount, colCount);
        }

        _createHexes(rowCount, colCount, width, ordered) {
            for (let i = 0; i < rowCount; i++) {
                let row = [];
                this.rows.push(row);
                if (i % 2 === 1) {
                    row.push(null);
                }
                for (let j = 0; j < colCount; j++) {
                    let hex = new Hex(j * 2 + (i % 2), i, width, ordered);
                    hex.map = this;
                    row.push(hex, hex);
                    this.hexes.push(hex);
                    this.hexSupport.add(hex.component);
                    this.itemSupport.add(hex.itemSupport);
                }
            }
        }

        _linkHexes(rowCount, colCount) {
            for (let i = 0; i < rowCount; i++) {
                for (let j = 0; j < colCount; j++) {
                    let hex = this.rows[i][j * 2 + 1];
                    if (i > 0) {
                        if (i % 2 === 1) {
                            hex.nw = this.rows[i - 1][j * 2];
                            if (j * 2 < colCount * 2 - 1) {
                                hex.ne = this.rows[i - 1][j * 2 + 2];
                            }
                        }
                        else {
                            hex.ne = this.rows[i - 1][j * 2 + 1];
                            if (j > 0) {
                                hex.nw = this.rows[i - 1][j * 2 - 1];
                            }
                        }
                    }
                    if (i < rowCount - 1) {
                        if (i % 2 === 1) {
                            hex.sw = this.rows[i + 1][j * 2];
                            if (j * 2 < colCount * 2 - 1) {
                                hex.se = this.rows[i + 1][j * 2 + 2];
                            }
                        }
                        else {
                            hex.se = this.rows[i + 1][j * 2 + 1];
                            if (j > 0) {
                                hex.sw = this.rows[i + 1][j * 2 - 1];
                            }
                        }
                    }
                    if (i % 2 === 1) {
                        if (j > 0) {
                            hex.w = this.rows[i][j * 2 - 1];
                        }
                        if (j * 2 < colCount * 2 - 1) {
                            hex.e = this.rows[i][j * 2 + 3];
                        }
                    }
                    else {
                        if (j > 0) {
                            hex.w = this.rows[i][j * 2 - 2];
                        }
                        if (j * 2 < colCount * 2 - 1) {
                            hex.e = this.rows[i][j * 2 + 2];
                        }
                    }
                }

            }
        }

        logHexLinks(hex) {
            for (let d in ALL_DIRECTIONS) {
                hex[ALL_DIRECTIONS[d]] && console.log(hex.toString() + " nw " + hex[ALL_DIRECTIONS[d]].toString());
            }
        }

        getHex(x, y) {
            return this.rows[y][x];
        }

        getHexFromPoint(point) {
            let x = point.x - MARGIN;
            let y = point.y - MARGIN;
            let h = svg.Hexagon.height(this.hexWidth);
            let w = this.hexWidth / 2;
            let c = Math.floor(x / h);
            let r = Math.floor(y / (w * 3));
            if (r == this.rowCount) {
                r = this.rowCount - 1;
            }
            if (c < 0 || c >= this.colCount * 2 || r < 0 || r >= this.rowCount) {
                return null;
            }
            if ((y % (w * 3)) < w) {
                if ((c + r) % 2) {
                    if ((x % h) * w > (y % w) * h) {
                        r--;
                    }
                }
                else {
                    if ((x % h) * w + (y % w) * h < h * w) {
                        r--;
                    }
                }
            }
            return r < 0 ? null : this.rows[r][c];
        }

        localPoint() {
            return this.component.localPoint.apply(this, arguments);
        }

        globalPoint() {
            return this.component.globalPoint.apply(this, arguments);
        }

        addGlasses(callback) {
            this.hexes.forEach(function (hex) {
                hex.addGlass(callback)
            });
            return this;
        }

        removeGlasses() {
            this.hexes.forEach(function (hex) {
                hex.removeGlass()
            });
            return this;
        }

        execute(action) {
            this.hexes.forEach(action);
            return this;
        }
    }

    class Hex {

        constructor(x, y, width, ordered) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.hex = new svg.Hexagon(width, "V").color([120, 250, 120]);
            let height = this.hex.height();
            this.component = createSupport();
            this.ordered = makeOrdered(ordered);
            this.hexSupport = new svg.Ordered(ordered ? ordered.length : 0);
            this.component
                .add(this.hex)
                .add(this.hexSupport.active(false))
                .add(new svg.Hexagon(this.width, "V").color([], 2, [100, 100, 100]).opacity(0.3).active(false));
            this.itemSupport = createSupport();
            this.surfaces = {};
            this.lines = {};
            this.borders = {};
            this.items = [];

            function createSupport() {
                return new svg.Translation((x + 1) * height + MARGIN, (y + 1) * width * 3 / 2 - width / 2 + MARGIN);
            }
        }

        setOrder(ordered) {
            this.ordered = makeOrdered(ordered);
            this.hexSupport.order(ordered.length);
            return this;
        }

        setSurface(surface) {
            if (!this.surfaces[surface.type]) {
                this.surfaces[surface.type] = surface.setHex(this);
                this.hexSupport.set(this.ordered[surface.type], surface.component);
                surface.draw();
                this.nw && this.nw.drawSurface(surface.type);
                this.ne && this.ne.drawSurface(surface.type);
                this.e && this.e.drawSurface(surface.type);
                this.se && this.se.drawSurface(surface.type);
                this.sw && this.sw.drawSurface(surface.type);
                this.w && this.w.drawSurface(surface.type);
            }
            return this;
        }

        removeSurface(type) {
            if (this.surfaces[type]) {
                delete this.surfaces[type];
                this.hexSupport.unset(this.ordered[type]);
                this.nw && this.nw.drawSurface(type);
                this.ne && this.ne.drawSurface(type);
                this.e && this.e.drawSurface(type);
                this.se && this.se.drawSurface(type);
                this.sw && this.sw.drawSurface(type);
                this.w && this.w.drawSurface(type);
            }
            return this;
        }

        getSurface(type) {
            return this.surfaces[type];
        }

        drawSurface(type) {
            if (this.surfaces[type]) {
                this.surfaces[type].draw();
            }
        }

        setLine(line) {
            if (!this.lines[line.type]) {
                this.lines[line.type] = line.setHex(this);
                this.hexSupport.set(this.ordered[line.type], line.component);
                line.draw();
            }
            return this;
        }

        removeLine(type) {
            if (this.lines[type]) {
                delete this.lines[type];
                this.hexSupport.unset(this.ordered[type]);
            }
            return this;
        }

        getLine(type) {
            return this.lines[type];
        }

        setBorder(border) {
            if (!this.borders[border.type]) {
                this.borders[border.type] = border.setHex(this);
                this.hexSupport.set(this.ordered[border.type], border.component);
                border.draw();
            }
            return this;
        }

        removeBorder(type) {
            if (this.borders[type]) {
                delete this.borders[type];
                this.hexSupport.unset(this.ordered[type]);
            }
            return this;
        }

        getBorder(type) {
            return this.borders[type];
        }

        putItem(item, x, y) {
            if (this.items.add(item)) {
                if (x != undefined) {
                    item.component.move(x, y);
                }
                this.itemSupport.add(item.component);
                item.hex = this;
            }
            return this;
        }

        removeItem(item) {
            if (this.items.remove(item)) {
                this.itemSupport.remove(item.component);
                item.hex = null;
            }
            return this;
        }

        getItem(type) {
            for (var i = 0; i < this.items.length; i++) {
                if (this.items[i] instanceof type) {
                    return this.items[i];
                }
            }
            return null;
        }

        height() {
            return this.hex.height();
        }

        toString() {
            return "Hex : " + this.x + "," + this.y + " ";
        }

        addGlass(callback) {
            svg.addEvent(this.hex, 'click', event=> {
                var local = this.hex.localPoint(event.clientX, event.clientY);
                callback(this, local.x, local.y, this.getPiece(local), this.isCenter(local));
            });
            svg.removeEvent(this.hex, 'mousedown');
            return this;
        }

        /*
         removeGlass() {
         svg.removeEvent(this.hex, 'click', event=> {
         var local = this.hex.localPoint(event.clientX, event.clientY);
         callback(this, local.x, local.y, this.getPiece(local), this.isCenter(local));
         });
         svg.removeEvent(this.hex, 'mousedown');
         return this;
         }
         */

        isCenter(local) {
            return local.x * local.x + local.y * local.y < this.width * this.width / 4;
        }

        localPoint() {
            return this.component.localPoint.apply(this, arguments);
        }

        globalPoint() {
            return this.component.globalPoint.apply(this, arguments);
        }

        getPiece(local) {
            let slope = this.width / 2 / this.height();
            if (local.x <= 0) {
                if (local.x * slope > local.y) {
                    return "nw";
                }
                else if (local.x * slope > -local.y) {
                    return "sw";
                }
                else {
                    return "w";
                }
            }
            else {
                if (local.x * slope < -local.y) {
                    return "ne";
                }
                else if (local.x * slope < local.y) {
                    return "se";
                }
                else {
                    return "e";
                }
            }
        };
    }

    class Surface {

        constructor(type, colors) {
            this.type = type;
            this.colors = colors;
            this.component = new svg.Translation();
        }

        setHex(hex) {
            this.hex = hex;
            return this;
        }

        _process(leftDir, direction, rightDirection, angle) {
            let _same = direction => {
                return !this.hex[direction] || this.hex[direction].surfaces[this.type];
            };
            let point;
            let control1;
            let control2;
            if (_same(direction)) {
                if (_same(leftDir)) {
                    point = rotate(this.hex.height(), -this.hex.width / 2, angle);
                }
                else {
                    point = rotate(this.hex.height(), -this.hex.width / 2 * SECOND_REDUCTION_FACTOR, angle);
                }
                if (!this.back) {
                    this.back = new svg.Path(point.x, point.y);
                    this.path = new svg.Path(point.x, point.y);
                }
                if (_same(rightDirection)) {
                    point = rotate(this.hex.height(), this.hex.width / 2, angle);
                }
                else {
                    point = rotate(this.hex.height(), this.hex.width / 2 * SECOND_REDUCTION_FACTOR, angle);
                }
                this.back.line(point.x, point.y);
                this.path.move(point.x, point.y);
            }
            else {
                let rx = this.hex.height() * (0.5 + SECOND_REDUCTION_FACTOR / 2);
                let ry = this.hex.width / 2 * (1.5 - SECOND_REDUCTION_FACTOR / 2);
                let dx = this.hex.height() * REDUCTION_FACTOR;
                let dy = this.hex.width / 2 * REDUCTION_FACTOR;
                if (_same(leftDir)) {
                    point = rotate(rx, -ry, angle);
                    control1 = rotate(rx - dy / 3, -ry + dx / 3, angle);
                }
                else {
                    point = rotate(dx, -dy, angle);
                    control1 = rotate(dx + dy / 3, -dy + dx / 3, angle);
                }
                if (!this.back) {
                    this.back = new svg.Path(point.x, point.y);
                    this.path = new svg.Path(point.x, point.y);
                }
                if (_same(rightDirection)) {
                    point = rotate(rx, ry, angle);
                    control2 = rotate(rx - dy / 3, ry - dx / 3, angle);
                }
                else {
                    point = rotate(dx, dy, angle);
                    control2 = rotate(dx + dy / 3, dy - dx / 3, angle);
                }
                this.back.cubic(control1.x, control1.y, control2.x, control2.y, point.x, point.y);
                this.path.cubic(control1.x, control1.y, control2.x, control2.y, point.x, point.y);
            }

        }

        draw() {
            let x = 0;
            let y = 0;
            if (this.back) {
                this.component.remove(this.back);
                delete this.back;
                this.component.remove(this.path);
                delete this.path;
            }
            this._process("ne", "e", "se", 0);
            this._process("e", "se", "sw", 60);
            this._process("se", "sw", "w", 120);
            this._process("sw", "w", "nw", 180);
            this._process("w", "nw", "ne", 240);
            this._process("nw", "ne", "e", 300);
            if (this.path) {
                this.component.add(this.back.opacity(0.7).color(this.colors[0]));
                this.component.add(this.path.opacity(0.7).color([], this.colors[1], this.colors[2]));
            }
        }
    }

    class Border {

        constructor(type, sides, colors) {
            this.type = type;
            this.sides = sides;
            this.colors = colors;
            this.component = new svg.Translation();
        }

        addSide(direction, value) {
            this.sides[direction] = value;
            this.draw();
            return this;
        }

        removeSide(direction) {
            delete this.sides[direction];
            this.draw();
            return this;
        }

        getSide(direction) {
            return this.sides[direction];
        }

        getSides() {
            return this.sides;
        }

        setHex(hex) {
            this.hex = hex;
            return this;
        }

        _processCenter() {
            if (this._hasBorder("c")) {
                this.component.add(new svg.Hexagon(this.hex.width, "V").color(this.colors[0]));
                return true;
            }
            return false;
        }

        _process(leftDirection, direction, rightDirection, angle) {
            let start;
            let point;
            let control1;
            let control2;
            let back = null;
            let border = null;
            if (this._hasBorder(direction)) {
                let cx = this.hex.height();
                let cy = this.hex.width / 2;
                let rx = this.hex.height() * (0.5 + SECOND_REDUCTION_FACTOR / 2);
                let ry = this.hex.width / 2 * (1.5 - SECOND_REDUCTION_FACTOR / 2);
                let dx = this.hex.height() * this._getReductionFactor();
                let dy = this.hex.width / 2 * this._getReductionFactor();
                start = rotate(cx, -cy, angle);
                back = new svg.Path(start.x, start.y);
                border = new svg.Path(start.x, start.y);
                if (this._hasBorder(leftDirection)) {
                    point = rotate(dx, -dy, angle);
                    back.line(point.x, point.y);
                    border.move(point.x, point.y);
                    control1 = rotate(dx + dy / 3, -dy + dx / 3, angle);
                }
                else {
                    point = rotate(rx, -ry, angle);
                    back = new svg.Path(point.x, point.y);
                    border = new svg.Path(point.x, point.y);
                    control1 = rotate(rx - dy / 3, -ry + dx / 3, angle);
                }
                if (this._hasBorder(rightDirection)) {
                    point = rotate(dx, dy, angle);
                    control2 = rotate(dx + dy / 3, dy - dx / 3, angle);
                }
                else {
                    point = rotate(rx, ry, angle);
                    control2 = rotate(rx - dy / 3, ry - dx / 3, angle);
                }
                back.cubic(control1.x, control1.y, control2.x, control2.y, point.x, point.y);
                border.cubic(control1.x, control1.y, control2.x, control2.y, point.x, point.y);
                point = rotate(cx, cy, angle);
                back.line(point.x, point.y);
                back.line(start.x, start.y);
                this.component.add(back.color(this.colors[0]));
                this.component.add(border.color([], this.colors[1], this.colors[2]));
            }
        }

        _getReductionFactor() {
            let factor = 1;
            if (this.sides.ne && this.sides.ne < factor) factor = this.sides.ne;
            if (this.sides.e && this.sides.e < factor) factor = this.sides.e;
            if (this.sides.se && this.sides.se < factor) factor = this.sides.se;
            if (this.sides.sw && this.sides.sw < factor) factor = this.sides.sw;
            if (this.sides.w && this.sides.w < factor) factor = this.sides.w;
            if (this.sides.nw && this.sides.nw < factor) factor = this.sides.nw;
            return factor;
        }

        _hasBorder(direction) {
            return this.sides[direction];
        }

        draw() {
            let x = 0;
            let y = 0;
            this.component.clear();
            if (!this._processCenter()) {
                this._process("ne", "e", "se", 0);
                this._process("e", "se", "sw", 60);
                this._process("se", "sw", "w", 120);
                this._process("sw", "w", "nw", 180);
                this._process("w", "nw", "ne", 240);
                this._process("nw", "ne", "e", 300);
            }
        }
    }


    class Line {

        constructor(type, entries, colors) {
            this.type = type;
            this.colors = colors;
            this.entries = entries;
            this.component = new svg.Translation();
        }

        addEntry(direction, value) {
            this.entries[direction] = value;
            this.draw();
            return this;
        }

        removeEntry(direction) {
            delete this.entries[direction];
            this.draw();
            return this;
        }

        getEntry(direction) {
            return this.entries[direction];
        }

        getEntries() {
            return this.entries;
        }

        setHex(hex) {
            this.hex = hex;
            return this;
        }

        draw() {
            let x = 0;
            let y = 0;
            let emptySteps = 0;
            if (this.path) {
                this.component.remove(this.back);
                delete this.back;
                this.component.remove(this.path);
                delete this.path;
            }
            let firstEntry = this._startProcess("e", null, 0);
            let control = this._endProcess("e", 0);
            firstEntry = this._startProcess("se", control, 60) || firstEntry;
            control = this._endProcess("se", 60) || enlarge(control);
            firstEntry = this._startProcess("sw", control, 120) || firstEntry;
            control = this._endProcess("sw", 120) || enlarge(control);
            firstEntry = this._startProcess("w", control, 180) || firstEntry;
            control = this._endProcess("w", 180) || enlarge(control);
            firstEntry = this._startProcess("nw", control, 240) || firstEntry;
            control = this._endProcess("nw", 240) || enlarge(control);
            firstEntry = this._startProcess("ne", control, 300) || firstEntry;
            control = this._endProcess("ne", 300) || enlarge(control);
            if (firstEntry) {
                for (var i = 0; i < emptySteps; i++) {
                    control.x *= LINE_ENLARGE_FACTOR;
                }
                this._startProcess(firstEntry[0], control, firstEntry[1]);
            }
            if (this.path) {
                this.component.add(this.back.color(this.colors[0]));
                this.component.add(this.path.color([], this.colors[1], this.colors[2]));
            }

            function enlarge(control) {
                if (control) {
                    control.x *= LINE_ENLARGE_FACTOR
                }
                else {
                    emptySteps += 1;
                }
                return control;
            }

        }

        _endProcess(entry, angle) {
            let point;
            if (this.entries[entry]) {
                point = rotate(this.hex.height(), 0, angle);
                if (!this.path) {
                    this.back = new svg.Path(point.x, point.y);
                    this.path = new svg.Path(point.x, point.y);
                }
                else {
                    this.back.line(point.x, point.y);
                }
                let wideness = this.entries[entry] * this.hex.width;
                point = rotate(this.hex.height(), wideness / 2, angle);
                this.back.line(point.x, point.y);
                this.path.move(point.x, point.y);
                point = rotate(this.hex.height() * .75, wideness / 2, angle);
                this.back.line(point.x, point.y);
                this.path.line(point.x, point.y);
                return {x: this.hex.height() * LINE_CONTROL_FACTOR, y: wideness / 2, angle: angle};
            }
            else {
                return null;
            }
        }

        _startProcess(entry, control1, angle) {
            let point;
            let control2;
            if (this.entries[entry]) {
                if (!this.path) {
                    return [entry, angle];
                }
                control1 = rotate(control1.x, control1.y, control1.angle);
                var wideness = this.entries[entry] * this.hex.width;
                control2 = rotate(this.hex.height() * LINE_CONTROL_FACTOR, -wideness / 2, angle);
                point = rotate(this.hex.height() * .75, -wideness / 2, angle);
                this.back.cubic(control1.x, control1.y, control2.x, control2.y, point.x, point.y);
                this.path.cubic(control1.x, control1.y, control2.x, control2.y, point.x, point.y);
                point = rotate(this.hex.height(), -wideness / 2, angle);
                this.back.line(point.x, point.y);
                this.path.line(point.x, point.y);
                point = rotate(this.hex.height(), 0, angle);
                this.back.line(point.x, point.y);
            }
            return null;
        }

    }

    const ANCHOR_MARGIN = 10;

    class Item {

        constructor(angle, glass) {
            this.base = new svg.Translation();
            this.rotation = new svg.Rotation(angle);
            this.component = new svg.Translation().add(this.rotation.add(this.base));
            this.glass = glass;
            this.rotation.add(this.glass);
            this.events = {};
        }

        rotate(angle) {
            this.rotation.rotate(angle);
            return this;
        }

        move(x, y) {
            this.component.move(x, y);
            return this;
        }

        addEvent(eventName, handler) {
            svg.addEvent(this.glass, eventName, handler);
            this.events[eventName] = handler;
        }

        removeEvent(eventName) {
            svg.removeEvent(this.glass, eventName, this.events[eventName]);
            delete this.events[eventName];
        }

        get angle() {
            return this.rotation.angle;
        }

        get x() {
            return this.component.x;
        }

        get y() {
            return this.component.y;
        }

    }

    class Composite extends Item {

        constructor(angle, width) {
            super(angle, new svg.Hexagon(width, "V").color([255, 0, 0], 0, []).opacity(0.001));
            this.width = width;
            this.children = [];
        }

        highlight(flag) {
            this.glass.opacity(flag ? 0.2 : 0.001);
            return this;
        }

        isHighlighted() {
            var result = this.glass._opacity === 0.2;
            return result;
        }

        add(item) {
            if (this.children.add(item)) {
                this.base.add(item.component);
            }
            return this;
        }

        remove(item) {
            if (this.children.remove(item)) {
                this.base.remove(item.component);
            }
            return this;
        }

        conform() {
            for (let i = 0; i < this.children.length; i++) {
                let item = this.children[i];
                item.rotate(item.angle + this.angle);
                let point = svg.rotate(item.x, item.y, this.angle);
                item.move(point.x, point.y);
            }
            this.rotate(0);
        }

        clear() {
            let item;
            while (item = this.children.pop()) {
                this.base.remove(item.component);
            }
            return this;
        }

        anchor(x, y) {
            for (let i = 0; i < this.glass.points.length; i++) {
                let point = this.glass.points[i];
                let dist = (point.x - x) * (point.x - x) + (point.y - y) * (point.y - y);
                if (dist < ANCHOR_MARGIN * ANCHOR_MARGIN) {
                    return {x: x, y: y};
                }
            }
            return null;
        }

        duplicate() {
            var dup = new Composite(this.angle, this.width);
            dup.copy(this.children);
            return dup;
        }

        copy(items) {
            for (let i = 0; i < items.length; i++) {
                this.add(items[i].duplicate());
            }
            return this;
        }

    }

    class House extends Item {

        constructor(width, height, colors, angle) {
            super(angle, new svg.Rect(width, height).color([0, 0, 0]).opacity(0.001));
            this.width = width;
            this.height = height;
            this.colors = colors;
            this.base
                .add(new svg.Rect(width, height).color(colors[0], colors[1], colors[2]))
                .add(new svg.Line(-width / 2, -height / 2, -width / 2 + height / 2, 0).color(colors[0], colors[1], colors[2]))
                .add(new svg.Line(-width / 2, height / 2, -width / 2 + height / 2, 0).color(colors[0], colors[1], colors[2]))
                .add(new svg.Line(-width / 2 + height / 2, 0, width / 2 - height / 2, 0).color(colors[0], colors[1], colors[2]))
                .add(new svg.Line(width / 2, -height / 2, width / 2 - height / 2, 0).color(colors[0], colors[1], colors[2]))
                .add(new svg.Line(width / 2, height / 2, width / 2 - height / 2, 0).color(colors[0], colors[1], colors[2]));
        }

        anchor(x, y) {
            var anchorX = null;
            var anchorY = null;
            if (x < -this.glass.width / 2 + ANCHOR_MARGIN) {
                anchorX = -this.glass.width / 2;
            }
            if (x > this.glass.width / 2 - ANCHOR_MARGIN) {
                anchorX = this.glass.width / 2;
            }
            if (y < -this.glass.height / 2 + ANCHOR_MARGIN) {
                anchorY = -this.glass.height / 2;
            }
            if (y > this.glass.height / 2 - ANCHOR_MARGIN) {
                anchorY = this.glass.height / 2;
            }
            return anchorX != null && anchorY != null ? {x: anchorX, y: anchorY} : null;
        }

        duplicate() {
            var house = new House(this.width, this.height, this.colors, this.angle);
            if (this.x != undefined) {
                house.move(this.x, this.y);
            }
            return house;
        }

    }

    class RoundOpenTower extends Item {

        constructor(radius, colors) {
            super(0, new svg.Circle(radius).color([0, 0, 0]).opacity(0.001));
            this.radius = radius;
            this.colors = colors;
            this.base
                .add(new svg.Circle(radius).color(colors[0], colors[1], colors[2]))
                .add(new svg.Circle(Math.round(radius * 0.8)).color(colors[0], colors[1], colors[2]));
        }

        anchor(x, y) {
            return null;
        }

        duplicate() {
            let tower = new RoundOpenTower(this.radius, this.colors);
            if (this.x != undefined) {
                tower.move(this.x, this.y);
            }
            return tower;
        }
    }

    class SquareOpenTower extends Item {

        constructor(width, height, colors, angle) {
            super(angle, new svg.Rect(width, height).color([0, 0, 0]).opacity(0.001));
            this.width = width;
            this.height = height;
            this.colors = colors;
            this.base
                .add(new svg.Rect(width, height).color(colors[0], colors[1], colors[2]))
                .add(new svg.Rect(Math.round(width * 0.8), Math.round(height * 0.8)).color(colors[0], colors[1], colors[2]));
        }

        anchor(x, y) {
            var anchorX = null;
            var anchorY = null;
            if (x < -this.glass.width / 2 + ANCHOR_MARGIN) {
                anchorX = -this.glass.width / 2;
            }
            if (x > this.glass.width / 2 - ANCHOR_MARGIN) {
                anchorX = this.glass.width / 2;
            }
            if (y < -this.glass.height / 2 + ANCHOR_MARGIN) {
                anchorY = -this.glass.height / 2;
            }
            if (y > this.glass.height / 2 - ANCHOR_MARGIN) {
                anchorY = this.glass.height / 2;
            }
            return anchorX != null && anchorY != null ? {x: anchorX, y: anchorY} : null;
        }

        duplicate() {
            var tower = new SquareOpenTower(this.width, this.height, this.colors, this.angle);
            if (this.x != undefined) {
                tower.move(this.x, this.y);
            }
            return tower;
        }
    }

    class Bridge extends Item {

        constructor(width, height, colors, angle) {
            const BORDER_FACTOR = 1;
            super(angle, new svg.Rect(width, height).color([0, 0, 0]).opacity(0.001));
            this.width = width;
            this.height = height;
            this.colors = colors;
            this.base
                .add(new svg.Rect(width, height).color(colors[0], colors[1], colors[2]))
                .add(new svg.Polygon(0, 0)
                    .add(-width / 2, -height / 2).trace(-height / 3, -height / 3).trace(height / 6, -height / 6)
                    .add(-width / 2 + height / 4, -height / 2 - height / 4)
                    .add(width / 2 - height / 4, -height / 2 - height / 4).trace(height * (5 / 12), -height / 4).trace(height / 6, height / 6)
                    .add(width / 2, -height / 2)
                    .color(colors[0], colors[1], colors[2]))
                .add(new svg.Polygon(0, 0)
                    .add(-width / 2, height / 2).trace(-height / 3, height / 3).trace(height / 6, height / 6)
                    .add(-width / 2 + height / 4, height / 2 + height / 4)
                    .add(width / 2 - height / 4, height / 2 + height / 4).trace(height * (5 / 12), height / 4).trace(height / 6, -height / 6)
                    .add(width / 2, height / 2)
                    .color(colors[0], colors[1], colors[2]));
        }

        anchor(x, y) {
            let anchorX = null;
            let anchorY = null;
            if (x < -this.glass.width / 2 + ANCHOR_MARGIN) {
                anchorX = -this.glass.width / 2;
            }
            if (x > this.glass.width / 2 - ANCHOR_MARGIN) {
                anchorX = this.glass.width / 2;
            }
            if (y < -this.glass.height / 2 + ANCHOR_MARGIN) {
                anchorY = -this.glass.height / 2;
            }
            if (y > this.glass.height / 2 - ANCHOR_MARGIN) {
                anchorY = this.glass.height / 2;
            }
            return anchorX != null && anchorY != null ? {x: anchorX, y: anchorY} : null;
        }

        duplicate() {
            let bridge = new Bridge(this.width, this.height, this.colors, this.angle);
            if (this.x != undefined) {
                bridge.move(this.x, this.y);
            }
            return bridge;
        }
    }

    class Tree extends Item {

        constructor(points, colors, angle) {
            super(angle, this._createGlass(points));
            this.points = points;
            this.colors = colors;
            this.component = new svg.Translation().add(new svg.Rotation(angle).add(this.base));
            this.base.add(this._createTree(points));
        }

        _createGlass(points) {
            var start = true;
            var glass = new svg.Polygon(0, 0);
            for (var i = 0; i < points.length; i++) {
                glass.add(points[i].x, points[i].y);
            }
            return glass;
        }

        _createTree(points) {
            let start = true;
            let tree = new svg.Path().color(colors[0], colors[1], colors[2]);
            for (let i = 0; i < points.length; i++) {
                let point = points[i];
                let prevPoint = i === 0 ? points[points.length - 1] : points[i - 1];
                let nextPoint = i === points.length - 1 ? points[0] : points[i + 1];
                let startMiddle = {x: (prevPoint.x + point.x) / 2, y: (prevPoint.y + point.y) / 2};
                let lastMiddle = {x: (nextPoint.x + point.x) / 2, y: (nextPoint.y + point.y) / 2};
                if (start) {
                    tree.move(startMiddle.x, startMiddle.y);
                    start = false;
                }
                tree.bezier(point.x, point.y, lastMiddle.x, lastMiddle.y);
            }
            return tree;
        }

        anchor(x, y) {
            return x * x + y * y > ANCHOR_MARGIN * ANCHOR_MARGIN ? {x: x, y: y} : null;
        }

        duplicate() {
            let tree = new Tree(this.points, this.colors, this.angle);
            if (this.x != undefined) {
                tree.move(this.x, this.y);
            }
            return tree;
        };
    }

    return {
        isEmpty : isEmpty,
        inverseDirection : inverseDirection,

        Map : Map,
        Hex : Hex,
        Surface : Surface,
        Line : Line,
        Border : Border,
        Item : Item,
        Composite : Composite,
        House : House,
        RoundOpenTower : RoundOpenTower,
        SquareOpenTower : SquareOpenTower,
        Tree : Tree,
        Bridge : Bridge,

        HEX_WIDTH : HEX_WIDTH,
        ALL_DIRECTIONS : ALL_DIRECTIONS
    };
};
