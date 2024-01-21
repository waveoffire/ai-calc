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
<button @click="trainModel()">train</button>
      <button @click="useModel()">use</button>

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
let model;
const Status = {
  Ok: "ok",
  NotOk: "notok",
  SyntaxError: "syntaxerror"
}
// 1 to +, 2 to -, 3 to *, 4 to /
const trainingDataset = {
  inputs: [
  ],
  outputs: [], // corresponding outputs for the input sequences
  inputSize: 3, // Size of each input sequence
  outputSize: 15, // Number of possible outputs (adjust based on your needs)
};

const _trainingDataset = {
  inputs: [
    [
      [
        0,
        1,
        2,
        3
      ],
      [
        0,
        1,
        2,
        4
      ],
    ]
  ]
    // ... add more input sequences ...
  ,
  outputs: [14,7,11,21,33,6,7,13,19], // corresponding outputs for the input sequences
  inputSize: 1, // Size of each input sequence
  outputSize: 1, // Number of possible outputs (adjust based on your needs)
};

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
      model:""
    };
  },
  methods: {
   generateRandom(){
     return Math.floor(Math.random() * 9) + 1;
   },
    generateData(){
     trainingDataset.inputs = []
      trainingDataset.outputs = []
      for (let i = 0; i < 1000; i++) {
        const num1 = this.generateRandom();
        const num2 = this.generateRandom();
        const operation = Math.floor(Math.random() * 4) + 1; // 1: +, 2: -, 3: *, 4: /
        let result;
        switch (operation) {
          case 1:
            result = num1 + num2;
            break;
          case 2:
            result = num1 - num2;
            break;
          case 3:
            result = num1 * num2;
            break;
          case 4:
            result = num1 / num2;
            break;
          default:
            result = 0;
        }

        trainingDataset.inputs.push([num1, operation, num2]);
        trainingDataset.outputs.push(result);
      }
console.log(trainingDataset.inputs,trainingDataset.outputs)
      },
    async trainModel() {
     this.generateData()
      await tf.setBackend('webgl');
      const input = tf.input({ shape: [3] });
// Pierwsza warstwa gęsta z aktywacją ReLU
      const dense1 = tf.layers.dense({ units: 1024, activation: 'relu',inputShape:[3] }).apply(input);

// Batch Normalization po pierwszej warstwie gęstej
      const batchNorm = tf.layers.batchNormalization({units:8, axis: 1,inputShape:[512], activation: 'relu' }).apply(dense1);

// Druga warstwa gęsta
      const dense2 = tf.layers.dense({ inputShape:[8],units: 512, activation: 'relu' }).apply(batchNorm);
      const dense3 = tf.layers.dense({ inputShape:[512],units: 1}).apply(dense2);

      // Model funkcyjny
      model  = tf.model({ inputs: input, outputs: [dense3] });
      model.summary()
      // Compile the model
      await model.compile({
        optimizer: 'adam', //sgd
        loss: 'meanSquaredError',

      });

      // Convert input and output data to tensors


      const xs = tf.tensor2d(trainingDataset.inputs, [1000 ,3]);
      const ys = tf.tensor2d(trainingDataset.outputs, [1000, 1])

      const epochs = 1000

      // Train the model
      await model.fit(xs, ys, {
        epochs: epochs,
        shuffle: true,
        batch_size: 512,  // Dostosuj rozmiar batcha

        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            console.log(`Epoch ${epoch + 1}/${epochs}, Loss: ${logs.loss}, Acc: ${logs.acc}`);
          },
        },
      });
      await model.save('localstorage://my-model-1');


    },
    async useModel(){
     console.log(await this.loadModel())
      console.log(await model.predict(tf.tensor2d([6,3,2], [1, 3])).dataSync()[0])
      console.log(Math.round(await model.predict(tf.tensor2d([6,3,2], [1, 3])).dataSync()[0]))
    },
    async loadModel() {
      // Load the pre-trained model
      model  = await tf.loadLayersModel('localstorage://my-model-1');
      console.log( model)
      return  model
    },

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
