<template>
  <div id="app">
    <div class="sum">
      <span
        class="todo-item"
        v-for="(item, i) in numbers"
        :key="i"
        draggable="true"
        @dragstart="dragStart(i, $event,'number')"
        @dragover.prevent
        @dragenter="dragEnter"
        @dragleave="dragLeave"
        @dragend="dragEnd"
        @drop="dragFinish(i, $event,false)"
      >
        {{ item }}
      </span>
    </div>
<div class="status">
  {{status}}
</div>

    <div class="signs">
      <span
        class="sign"
        v-for="(item, i) in listofsigns"
        :key="i"
        draggable="true"
        @dragstart="dragStart(i, $event,'sign')"
        @dragover.prevent
        @dragenter="dragEnter"
        @dragleave="dragLeave"
        @dragend="dragEnd"
        @drop="dragFinish(i, $event,true)"
      >
        {{ item }}
      </span>
    </div>
  </div>
</template>
<script>
import { defineComponent } from "vue";
import { evaluate } from "mathjs";
import '@tensorflow/tfjs-core';
// Register WebGL backend.
import '@tensorflow/tfjs-backend-webgl';

import * as tf from '@tensorflow/tfjs'

/*
let model = tf.sequential();
model.add(tf.layers.embedding({ inputDim: vocabularySize, outputDim: embeddingDim }));
model.add(tf.layers.lstm({ units: hiddenUnits }));
model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

const trainingData = [
  { input: 'example1', actions: ['swap', 'add'], trueOutcome: true },
  // ...
];

const inputTensors = trainingData.map(example => tf.tensor([example.input]));
const actionTensors = trainingData.map(example => tf.tensor(example.actions));
const trueOutcomeTensors = tf.tensor(trainingData.map(example => example.trueOutcome));

model.compile({
  loss: 'binaryCrossentropy',
  optimizer: 'adam',
});

model.fit(
    [inputTensors, actionTensors],
    trueOutcomeTensors,
    { epochs: 100, batchSize: 32 },
    () => console.log('Training complete!')
);
 */


const Status = {
  Ok: "ok",
  NotOk: "notok",
  SyntaxError: "syntaxerror"
}


export default defineComponent({
  name: "HomeView",
  components: {},
  data() {
    return {
      numbers: [1, 2, 3, 4],
      listofsigns: ["(", "+", "-", "*", "/", ")"],
      newItem: "",
      dragging: {what:"",which:-1},
      status: "",
      savedmodel:""
    };
  },
  methods: {

    dragStart(which, ev,what) {
      ev.dataTransfer.setData("Text", this.id);
      ev.dataTransfer.dropEffect = "move";
      this.dragging.what = what;
      this.dragging.which = which;
    },
    dragEnter(ev) {
      /*
      if (ev.clientY > ev.target.height / 2) {
        ev.target.style.marginBottom = '10px'
      } else {
        ev.target.style.marginTop = '10px'
      }
      */
    },
    dragLeave(ev) {
      /*
      ev.target.style.marginTop = '2px'
      ev.target.style.marginBottom = '2px'
      */
    },
    dragEnd(ev) {
      this.dragging.which = -1;
    },
    dragFinish(to, ev,toSign) {
      if(this.dragging.what=="sign" && !toSign){
        const copiedItem = Object.assign(this.listofsigns[this.dragging.which]);
        this.numbers.splice(to, 0, copiedItem);
      }else if (this.dragging.what=="number" && !toSign){
        this.moveItem(this.dragging.which, to);
      }else if (this.dragging.what=="number" && toSign) {
        if (isNaN(this.numbers[this.dragging.which])) {
          this.removeItem(this.dragging.which);
        }
      }
      if (ev != null) {
        ev.target.style.marginTop = "2px";
        ev.target.style.marginBottom = "2px";
      }
      this.status=this.checkNumbers()
    },
    removeItem(item) {
      this.numbers.splice(item, 1);
    },

    moveItem(from, to) {
      this.numbers.splice(to, 0, this.numbers.splice(from, 1)[0]);
    },
    checkNumbers(){
      if (this.numbers === undefined)
        return Status.SyntaxError

      let eq = this.numbers.join("");

      let error = false;
      eq.split(/[-+*/()]/).forEach((item) => {
        if (item.length > 1)
        {
          console.log(`length:`)
          error = true;
        }
      })

      if (error)
        return Status.SyntaxError;

      console.log(eq)
      try {
        let result = evaluate(eq)
        console.log(result)
        if (result === 10){
          return Status.Ok;
        }
        return Status.NotOk;
      }
      catch (e) {
        console.log(e)
        return Status.SyntaxError;
      }
    }
  },
  computed: {

    isDragging() {
      return this.dragging.which > -1;
    },
  },

  // watch todos change for localStorage persistence
});
</script>
<style>
.status{
  padding-top: 20px;
}
.signs {
  padding-top: 100px;
}
.sign {
  margin: 20px;
  font-size: 40px;
}
body {
  font-family: "Source Sans Pro", "Arial", sans-serif;
}

* {
  box-sizing: border-box;
}

.todo-list {
  list-style-type: none;
  padding: 10px;
}

.done {
  text-decoration: line-through;
  color: #888;
}

.new-todo {
  width: 100%;
}

.trash-drop {
  border: 2px dashed #ccc !important;
  text-align: center;
  color: #e33;
}

.trash-drop:-moz-drag-over {
  border: 2px solid red;
}

.todo-item {
  border: 1px solid #ccc;
  border-radius: 2px;
  padding: 14px 8px;
  margin-bottom: 3px;
  background-color: #fff;
  box-shadow: 1px 2px 2px #ccc;
  font-size: 22px;
}

.remove-item {
  float: right;
  color: #a45;
  opacity: 0.5;
}

.todo-item:hover .remove-item {
  opacity: 1;
  font-size: 28px;
}
</style>
