<template>
    <div class="sum container">
      <div class="row">
        <div class="col-6">
          Optimizer:
          <select class="form-select" v-model="optimizerValue" id="optimizer">
            <option value="sgd">Stochastic Gradient Descent (SGD)</option>
            <option selected="selected" value="adam">Adam</option>
            <option value="adagrad">Adagrad</option>
            <option value="rmpsprop">RMSprop</option>
            <option value="adadelta">Adadelta</option>
            <option value="adamax">Adamax</option>
            <option value="nadam">Nadam</option>
          </select>
        </div>
        <div class="col-6">
          Loss:
          <select class="form-select" v-model="lossValue" id="loss">
            <option selected value="meanSquaredError">Mean Squared Error (MSE)</option>
            <option value="meanAbsoluteError">Mean Absolute Error (MAE)</option>
            <option value="categoricalCrossentropy">Categorical Crossentropy</option>
            <option value="sparseCategoricalCrossentropy">Sparse Categorical Crossentropy</option>
            <option value="binaryCrossentropy">Binary Crossentropy</option>
            <option value="hinge">Hinge Loss</option>
            <option value="huber">Huber Loss</option>
            <option value="logcosh">Logcosh Loss</option>
          </select>
        </div>
 </div>
<div class="row">
  <div class="col-4">
    Max number:
    <input class="form-control"  @change="check()" v-model="maxNumberValue" type="number"/>
  </div>
  <div class="col-4">        Number of generated inputs:
    <input class="form-control" @change="check()" v-model="inputAmountValue"  type="number"/>
  </div>
  <div class="col-4">       Number of epochs:
    <input class="form-control" @change="check()" v-model="epochsValue"  type="number"/></div>

</div>
<div class="row">
  <div class="col-12">    <button class="btn btn-info" @click="trainModel()">Train</button>
  </div>
</div>
<div class="row">
  <div class="col-12">
    <span v-text="trainStatus"></span>
  </div>
</div>
      <div class="row">
        <div class="col-12">
          Calculate:
          <input class="form-control" v-model="equationValue" type="text"/>
          <button class="btn btn-success"  @click="useModel()">Calculate!</button>
        </div>

      </div>
<div class="row">
  <div class="col-12">
    Real value: <span v-text="outputReal"></span>
  </div>
</div>
      <div class="row">
        <div class="col-12">
          Rounded value: <span v-text="outputRounded"></span>
          <span v-text="offset"></span>
        </div>
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
// 1 to +, 2 to -, 3 to *, 4 to /
const trainingDataset = {
  inputs: [
  ],
  outputs: [],
  inputSize: 3,
  outputSize: 15,
};


export default defineComponent({
  name: "HomeView",
  components: {},
  data() {
    return {
      optimizerValue: "adam",
        lossValue: "meanSquaredError",
        maxNumberValue: 9,
        inputAmountValue: 1000,
        epochsValue: 1000,
        trainStatus: "",
        equationValue: "",
        outputReal: "",
        outputRounded: "",
        offset: "",
    };
  },
  methods: {
   generateRandom(){
     return Math.floor(Math.random() * this.maxNumberValue) + 1;
   },
    generateData(amount){
       console.log("amount:" + amount)
     trainingDataset.inputs = []
      trainingDataset.outputs = []
      for (let i = 0; i < amount; i++) {
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
       const inputAmount = this.inputAmountValue;
       const epochs = this.epochsValue;
       const optimizer = this.optimizerValue;
       const loss = this.lossValue;
       console.log(inputAmount)
        console.log(epochs)

     this.generateData(inputAmount)
        console.log(trainingDataset.inputs.length)
        trainingDataset.inputs.forEach((_) => {
            console.log(_.length)
        });
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
        optimizer: optimizer, //sgd
        loss: loss,

      });

      // Convert input and output data to tensors


      const xs = tf.tensor2d(trainingDataset.inputs, [trainingDataset.inputs.length ,3]);
      const ys = tf.tensor2d(trainingDataset.outputs, [trainingDataset.outputs.length, 1])

        let stopwatch = new Date();
      // Train the model
      await model.fit(xs, ys, {
        epochs: epochs,
        shuffle: true,
        batch_size: 512,  // Dostosuj rozmiar batcha

        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
              this.trainStatus = `Training... Epoch ${epoch + 1}/${epochs}, Loss: ${logs.loss}`;
          },
        },
      });
      this.trainStatus = "Trained! Took " + (Math.abs(stopwatch - new Date()) / 1000) + " seconds.";
      await model.save('localstorage://my-model-1');


    },
      equationToArray(equation) {
          const regex = /([\d.]+|[*/+\-])/g;

          const operatorMap = {
              '+': 1,
              '-': 2,
              '*': 3,
              '/': 4
          };

          return equation.match(regex).map(item => {
              if (!isNaN(item)) {
                  return parseInt(item, 10);
              } else {
                  return operatorMap[item];
              }
          });
      },
    async useModel(){
      await this.loadModel()
        let equation = this.equationToArray(this.equationValue)
      //console.log(await this.loadModel())
        console.log(equation)
        let result = await model.predict(tf.tensor2d(equation, [1, 3])).dataSync()[0]

        this.outputReal = result;
      this.outputRounded = Math.round(result);
      let e = eval(this.equationValue);
      if (e === this.outputRounded)
          this.offset = "(perfect!)";
      else
          this.offset = "(only " + Math.abs(result - e) + " off!)";
    },
    async loadModel() {
      // Load the pre-trained model
      model  = await tf.loadLayersModel('localstorage://my-model-1');
      console.log( model)
      return  model
    },
      check() {

      }
  },


  // watch todos change for localStorage persistence
});
</script>
<style lang="scss">

.sum{
  font-size: 20px;
  padding-top: 50px;
div{
  padding-top: 20px;
  button{
    font-size: 30px;
    padding: 20px;
  }
}
}


</style>
