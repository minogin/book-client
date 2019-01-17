<template>
  <div class="vdr" :style="style"
       :class="classObject"
       @dblclick="dblclick($event)"
       @mousedown="bodyDown($event)"
       @touchstart.stop.prevent="bodyDown($event)">
    <slot></slot>
    <div
      v-for="stick in sticks"
      class="vdr-stick"
      :class="['vdr-stick-' + stick, isResizable ? '' : 'not-resizable']"
      @mousedown.stop.prevent="stickDown(stick, $event)"
      @touchstart.stop.prevent="stickDown(stick, $event)"
      :style="vdrStick(stick)">zepp
    </div>
    <div class="ro-stick-handle" v-if="isRotatable"></div>
  </div>
</template>

<script>
  import Vector from '@minogin/vector'

  const _ = require('lodash');

  const stickSize = 8;
  const roStickSize = 20;
  const styleMapping = {
    y: {
      t: 'top',
      m: 'marginTop',
      b: 'bottom',
    },
    x: {
      l: 'left',
      m: 'marginLeft',
      r: 'right',
    }
  };

  export default {
    name: 'vue-drag-resize',
    props: {
      selectable: {
        type: Boolean, default: true
      },
      isActive: {
        type: Boolean, default: false
      },
      hasActiveContent: {
        type: Boolean, default: false
      },
      preventActiveBehavior: {
        type: Boolean, default: false
      },
      isDraggable: {
        type: Boolean, default: true
      },
      isResizable: {
        type: Boolean, default: true
      },
      isRotatable: {
        type: Boolean, default: true
      },
      aspectRatio: {
        type: Boolean, default: false
      },
      parentLimitation: {
        type: Boolean, default: false
      },
      parentW: {
        type: Number,
        default: 0,
        validator: function (val) {
          return val >= 0
        }
      },
      parentH: {
        type: Number,
        default: 0,
        validator: function (val) {
          return val >= 0
        }
      },
      w: {
        type: Number,
        default: 100,
        validator: function (val) {
          return val > 0
        }
      },
      h: {
        type: Number,
        default: 100,
        validator: function (val) {
          return val > 0
        }
      },
      minw: {
        type: Number,
        default: 50,
        validator: function (val) {
          return val > 0
        }
      },
      minh: {
        type: Number,
        default: 50,
        validator: function (val) {
          return val > 0
        }
      },
      x: {
        type: Number,
        default: 0,
        validator: function (val) {
          return typeof val === 'number'
        }
      },
      y: {
        type: Number,
        default: 0,
        validator: function (val) {
          return typeof val === 'number'
        }
      },
      z: {
        type: [String, Number],
        default: 'auto',
        validator: function (val) {
          let valid = (typeof val === 'string') ? val === 'auto' : val >= 0;
          return valid
        }
      },
      angle: {
        type: Number,
        default: 0,
        validator: function (val) {
          return typeof val === 'number'
        }
      },
      dragHandle: {
        type: String,
        default: null
      },
      dragCancel: {
        type: String,
        default: null
      },
      sticks: {
        type: Array,
        default: function () {
          let sticks = []
          if (this.isResizable)
            sticks.push('tl', 'tr', 'br', 'bl')
          if (this.isRotatable)
            sticks.push('ro')
          return sticks
        }
      },
      axis: {
        type: String,
        default: 'both',
        validator: function (val) {
          return ['x', 'y', 'both', 'none'].indexOf(val) !== -1
        }
      }
    },

    data: function () {
      return {
        active: this.isActive,
        contentActive: false,
        cx: this.x,
        cy: this.y,
        width: this.w,
        height: this.h,
        rotation: this.angle,
        zIndex: this.z,
        aspectFactor: this.w / this.h,
        parentWidth: null,
        parentHeight: null,
        minWidth: this.minw,
        minHeight: this.minh,
        bodyDrag: false,
        dragged: false,
        resized: false,
        rotated: false
      }
    },

    created: function () {
      this.stickDrag = false;
      // this.bodyDrag = false;
      this.stickAxis = null;
      this.stickStartPos = { mouseX: 0, mouseY: 0, x: 0, y: 0, w: 0, h: 0 };
      this.limits = {
        minLeft: null,
        maxLeft: null,
        minRight: null,
        maxRight: null,
        minTop: null,
        maxTop: null,
        minBottom: null,
        maxBottom: null
      };

      this.currentStick = [];
    },

    mounted: function () {
      if (this.hasActiveContent) {
        this.$on('contentActivate', this.contentActivate)
        this.$on('contentDeactivate', this.contentDeactivate)
      }

      this.parentElement = this.$el.parentNode;
      this.parentWidth = this.parentW ? this.parentW : this.parentElement.clientWidth;
      this.parentHeight = this.parentH ? this.parentH : this.parentElement.clientHeight;

      document.documentElement.addEventListener('mousemove', this.move);
      document.documentElement.addEventListener('mouseup', this.up);
      document.documentElement.addEventListener('mouseleave', this.up);

      document.documentElement.addEventListener('mousedown', this.deselect);

      document.documentElement.addEventListener('touchmove', this.move, true);
      document.documentElement.addEventListener('touchend touchcancel', this.up, true);
      document.documentElement.addEventListener('touchstart', this.up, true);

      if (this.dragHandle) {
        let dragHandles = Array.prototype.slice.call(this.$el.querySelectorAll(this.dragHandle));
        for (let i in dragHandles) {
          dragHandles[i].setAttribute('data-drag-handle', this._uid);
        }
      }

      if (this.dragCancel) {
        let cancelHandles = Array.prototype.slice.call(this.$el.querySelectorAll(this.dragCancel));
        for (let i in cancelHandles) {
          cancelHandles[i].setAttribute('data-drag-cancel', this._uid);
        }
      }
    },

    beforeDestroy: function () {
      document.documentElement.removeEventListener('mousemove', this.move);
      document.documentElement.removeEventListener('mouseup', this.up);
      document.documentElement.removeEventListener('mouseleave', this.up);

      document.documentElement.removeEventListener('mousedown', this.deselect);

      document.documentElement.removeEventListener('touchmove', this.move, true);
      document.documentElement.removeEventListener('touchend touchcancel', this.up, true);
      document.documentElement.removeEventListener('touchstart', this.up, true);
    },

    methods: {
      dblclick(e) {
        this.$emit('contentActivate')
      },

      contentActivate() {
        this.contentActive = true
        this.active = false
        for (const child of this.$children) {
          child.$emit('activate')
        }
      },

      contentDeactivate() {
        this.contentActive = false
        this.active = true
        for (const child of this.$children) {
          child.$emit('deactivate')
        }
      },

      deselect() {
        if (this.preventActiveBehavior) {
          return
        }
        this.active = false
      },

      move(ev) {
        if (!this.stickDrag && !this.bodyDrag) {
          return
        }

        ev.stopPropagation();

        if (this.stickDrag) {
          this.stickMove(ev);
        }
        if (this.bodyDrag) {
          this.bodyMove(ev)
        }
      },

      up(ev) {
        if (this.stickDrag) {
          this.stickUp(ev);
        }
        if (this.bodyDrag) {
          this.bodyUp(ev)
        }
      },

      bodyDown: function (ev) {
        if (this.contentActive || !this.selectable) {
          return
        }
        else {
          ev.stopPropagation()
          ev.preventDefault()
        }

        let target = ev.target || ev.srcElement;

        if (!this.preventActiveBehavior) {
          this.active = true;
        }

        if (ev.button && ev.button !== 0) {
          return
        }

        this.$emit('clicked', ev);

        if (!this.isDraggable || !this.active) {
          return
        }

        if (this.dragHandle && target.getAttribute('data-drag-handle') !== this._uid.toString()) {
          return
        }

        if (this.dragCancel && target.getAttribute('data-drag-cancel') === this._uid.toString()) {
          return
        }

        this.bodyDrag = true
        this.dragged = false

        this.dragStartEmitted = false
        this.startRect = _.cloneDeep(this.rect)

        this.stickStartPos.mouseX = ev.pageX || ev.touches[0].pageX
        this.stickStartPos.mouseY = ev.pageY || ev.touches[0].pageY

        this.stickStartPos.cx = this.cx
        this.stickStartPos.cy = this.cy

        if (this.parentLimitation) {
          this.limits = this.calcDragLimitation();
        }
      },

      calcDragLimitation() {
        const parentWidth = this.parentWidth;
        const parentHeight = this.parentHeight;

        return {
          minLeft: 0,
          maxLeft: parentWidth - this.width,
          minRight: 0,
          maxRight: parentWidth - this.width,
          minTop: 0,
          maxTop: parentHeight - this.height,
          minBottom: 0,
          maxBottom: parentHeight - this.height
        }
      },

      bodyMove(ev) {
        const stickStartPos = this.stickStartPos;

        const newPos = {
          mouseX: ev.pageX || ev.touches[0].pageX,
          mouseY: ev.pageY || ev.touches[0].pageY
        }
        const delta = {
          x: newPos.mouseX - stickStartPos.mouseX,
          y: newPos.mouseY - stickStartPos.mouseY
        }

        this.cx = stickStartPos.cx + delta.x
        this.cy = stickStartPos.cy + delta.y

        if (!this.dragStartEmitted) {
          this.$emit('dragstart', this.startRect);
          this.dragStartEmitted = true
        }

        this.dragged = true
        this.$emit('dragging', this.rect);
      },

      bodyUp() {
        this.bodyDrag = false;
        if (this.dragged)
          this.$emit('dragstop', this.rect, this.startRect);

        this.stickStartPos = { mouseX: 0, mouseY: 0, x: 0, y: 0, w: 0, h: 0 };
        this.limits = {
          minLeft: null,
          maxLeft: null,
          minRight: null,
          maxRight: null,
          minTop: null,
          maxTop: null,
          minBottom: null,
          maxBottom: null
        };
      },

      stickDown: function (stick, ev) {
        if (!this.isResizable || !this.active) {
          return
        }

        this.resizeStartEmitted = false
        this.rotateStartEmitted = false
        this.startRect = _.cloneDeep(this.rect)

        this.stickDrag = true;
        this.resized = false
        this.rotated = false
        this.stickStartPos.mouseX = ev.pageX || ev.touches[0].pageX;
        this.stickStartPos.mouseY = ev.pageY || ev.touches[0].pageY;
        this.stickStartPos.cx = this.cx;
        this.stickStartPos.cy = this.cy;
        this.stickStartPos.width = this.width;
        this.stickStartPos.height = this.height;
        this.stickStartPos.rotation = this.rotation;
        this.currentStick = stick
        this.stickAxis = null;

        this.limits = this.calcResizeLimitation();
      },

      calcResizeLimitation() {
        let minw = this.minWidth;
        let minh = this.minHeight;
        const aspectFactor = this.aspectFactor;
        const width = this.width;
        const height = this.height;
        const bottom = this.bottom;
        const top = this.top;
        const left = this.left;
        const right = this.right;
        const stickAxis = this.stickAxis;

        const parentLim = this.parentLimitation ? 0 : null;

        if (this.aspectRatio) {
          if (minw / minh > aspectFactor) {
            minh = minw / aspectFactor;
          } else {
            minw = aspectFactor * minh;
          }
        }

        let limits = {
          minLeft: parentLim,
          maxLeft: left + (width - minw),
          minRight: parentLim,
          maxRight: right + (width - minw),
          minTop: parentLim,
          maxTop: top + (height - minh),
          minBottom: parentLim,
          maxBottom: bottom + (height - minh)
        };

        if (this.aspectRatio) {
          const aspectLimits = {
            minLeft: left - (Math.min(top, bottom) * aspectFactor) * 2,
            maxLeft: left + ((((height - minh) / 2) * aspectFactor) * 2),

            minRight: right - (Math.min(top, bottom) * aspectFactor) * 2,
            maxRight: right + ((((height - minh) / 2) * aspectFactor) * 2),

            minTop: top - (Math.min(left, right) / aspectFactor) * 2,
            maxTop: top + ((((width - minw) / 2) / aspectFactor) * 2),

            minBottom: bottom - (Math.min(left, right) / aspectFactor) * 2,
            maxBottom: bottom + ((((width - minw) / 2) / aspectFactor) * 2)
          };

          if (stickAxis === 'x') {
            limits = {
              minLeft: Math.max(limits.minLeft, aspectLimits.minLeft),
              maxLeft: Math.min(limits.maxLeft, aspectLimits.maxLeft),
              minRight: Math.max(limits.minRight, aspectLimits.minRight),
              maxRight: Math.min(limits.maxRight, aspectLimits.maxRight)
            }
          } else if (stickAxis === 'y') {
            limits = {
              minTop: Math.max(limits.minTop, aspectLimits.minTop),
              maxTop: Math.min(limits.maxTop, aspectLimits.maxTop),
              minBottom: Math.max(limits.minBottom, aspectLimits.minBottom),
              maxBottom: Math.min(limits.maxBottom, aspectLimits.maxBottom)
            }
          }
        }


        return limits;
      },

      stickMove(ev) {
        const stickStartPos = this.stickStartPos;

        let delta = new Vector(
          (ev.pageX || ev.touches[0].pageX) - stickStartPos.mouseX,
          (ev.pageY || ev.touches[0].pageY) - stickStartPos.mouseY
        )


        if (this.currentStick == 'ro') {
          let up = new Vector(0, -(this.height) / 2 - roStickSize)
          let rotationRad = Vector.rad(stickStartPos.rotation);
          up = up.rotate(rotationRad)
          let v = up.add(delta)

          if (!this.rotateStartEmitted) {
            this.$emit('rotatestart', this.startRect);
            this.rotateStartEmitted = true
          }

          this.rotation = Vector.deg(v.angle()) + 90
          this.rotated = true
          this.$emit('rotating', this.rect);
        }
        else {
          let dirX = this.currentStick[1] == 'r' ? 1 : -1
          let dirY = this.currentStick[0] == 'b' ? 1 : -1

          let phi = Vector.rad(stickStartPos.rotation);
          let p
          if (this.aspectRatio) {
            let axis = new Vector(dirX * stickStartPos.width / 2, dirY * stickStartPos.height / 2)
            axis = axis.rotate(phi).unit()
            p = axis.mul(axis.mul(delta))
          }
          else {
            p = delta
          }
          this.cx = stickStartPos.cx + p.x / 2
          this.cy = stickStartPos.cy + p.y / 2
          let pn = p.rotate(-phi)
          this.width = stickStartPos.width + dirX * pn.x
          this.height = stickStartPos.height + dirY * pn.y

          if (!this.resizeStartEmitted) {
            this.$emit('resizestart', this.startRect);
            this.resizeStartEmitted = true
          }

          this.resized = true
          this.$emit('resizing', this.rect);
        }
      },

      stickUp() {
        this.stickDrag = false;
        this.stickStartPos = {
          mouseX: 0,
          mouseY: 0,
          x: 0,
          y: 0,
          w: 0,
          h: 0
        };
        this.limits = {
          minLeft: null,
          maxLeft: null,
          minRight: null,
          maxRight: null,
          minTop: null,
          maxTop: null,
          minBottom: null,
          maxBottom: null
        };

        this.stickAxis = null;

        if (this.resized)
          this.$emit('resizestop', this.rect, this.startRect);

        if (this.rotated)
          this.$emit('rotatestop', this.rect, this.startRect);
      },
    }
    ,

    computed: {
      classObject() {
        return {
          active: this.active || this.isActive,
          inactive: !(this.active || this.isActive),
          dragging: this.bodyDrag
        }
      }
      ,

      style() {
        return {
          left: (this.cx - this.width / 2) + 'px',
          top: (this.cy - this.height / 2) + 'px',
          width: this.width + 'px',
          height: this.height + 'px',
          zIndex: this.zIndex,
          transform: 'rotate(' + this.rotation + 'deg)'
        }
      }
      ,

      vdrStick() {
        return (stick) => {
          const stickStyle = {
            width: `${stickSize}px`,
            height: `${stickSize}px`,
          };
          if (stick == 'ro') {
            stickStyle['top'] = `${-stickSize / 2 - roStickSize}px`;
            stickStyle['marginLeft'] = `${-stickSize / 2 + 1}px`;
          }
          else {
            stickStyle[styleMapping.y[stick[0]]] = `${-stickSize / 2}px`;
            stickStyle[styleMapping.x[stick[1]]] = `${-stickSize / 2}px`;
          }
          return stickStyle;
        }
      }
      ,

      rect() {
        return {
          x: this.cx,
          y: this.cy,
          w: this.width,
          h: this.height,
          angle: this.rotation
        }
      }
    }
    ,

    watch: {
      active(val) {
        if (val) {
          this.$emit('activated');
        } else {
          this.$emit('deactivated');
        }
      }
      ,

      isActive(val) {
        this.active = val
      }
      ,

      z(val) {
        if (val >= 0 || val === 'auto') {
          this.zIndex = val
        }
      }
      ,

      aspectRatio(val) {
        if (val) {
          this.aspectFactor = this.width / this.height;
        }
      }
      ,

      minw(val) {
        if (val > 0 && val <= this.width) {
          this.minWidth = val
        }
      }
      ,

      minh(val) {
        if (val > 0 && val <= this.height) {
          this.minHeight = val
        }
      }
      ,

      x() {
        if (this.stickDrag || this.bodyDrag) {
          return
        }
        if (this.parentLimitation) {
          this.limits = this.calcDragLimitation();
        }

        let delta = this.x - this.left;
        this.cx = this.x;
      }
      ,

      y() {
        if (this.stickDrag || this.bodyDrag) {
          return
        }

        if (this.parentLimitation) {
          this.limits = this.calcDragLimitation();
        }

        let delta = this.y - this.top;
        this.cy = this.y;
      }
      ,

      w() {
        if (this.stickDrag || this.bodyDrag) {
          return
        }

        this.currentStick = ['m', 'r'];
        this.stickAxis = 'x';

        if (this.parentLimitation) {
          this.limits = this.calcResizeLimitation();
        }

        this.width = this.w
      }
      ,

      h() {
        if (this.stickDrag || this.bodyDrag) {
          return
        }

        this.currentStick = ['b', 'm'];
        this.stickAxis = 'y';

        if (this.parentLimitation) {
          this.limits = this.calcResizeLimitation();
        }

        this.height = this.h
      }
      ,

      angle() {
        if (this.stickDrag || this.bodyDrag) {
          return
        }

        this.rotation = this.angle
      }
      ,

      parentW(val) {
        this.right = val - this.width - this.left;
        this.parentWidth = val;

      }
      ,

      parentH(val) {
        this.bottom = val - this.height - this.top;
        this.parentHeight = val;

      }
    }
  }

</script>

<style scoped>
  .vdr {
    position: absolute;
    box-sizing: border-box;
    cursor: pointer;
  }

  .vdr:hover:before {
    content: '';
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    box-sizing: border-box;
    outline: 1px dashed #d6d6d6;
  }

  .vdr.active:before {
    content: '';
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    box-sizing: border-box;
    outline: 1px dashed #d6d6d6;
  }

  .vdr-stick {
    box-sizing: border-box;
    position: absolute;
    font-size: 1px;
    background: #ffffff;
    border: 1px solid #6c6c6c;
    box-shadow: 0 0 2px #bbb;
  }

  .vdr-stick:hover {
    border-color: lightskyblue;
  }

  .inactive .vdr-stick {
    display: none;
  }

  .vdr-stick-tl, .vdr-stick-br {
    cursor: nwse-resize;
  }

  .vdr-stick-tm, .vdr-stick-bm {
    left: 50%;
    cursor: ns-resize;
  }

  .vdr-stick-tr, .vdr-stick-bl {
    cursor: nesw-resize;
  }

  .vdr-stick-ml, .vdr-stick-mr {
    top: 50%;
    cursor: ew-resize;
  }

  .vdr-stick-ro {
    left: 50%;
    cursor: ew-resize;
    border-radius: 4px;
  }

  .ro-stick-handle {
    left: 50%;
    top: -16px;
    box-sizing: border-box;
    position: absolute;
    font-size: 1px;
    background: #ffffff;
    border: 1px solid #6c6c6c;
    box-shadow: 0 0 2px #bbb;
    width: 0px;
    height: 16px;
  }

  .inactive .ro-stick-handle {
    display: none;
  }

  .vdr-stick.not-resizable {
    display: none;
  }

</style>
