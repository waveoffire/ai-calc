const express = require("express");
const app = express();
const tf = require('@tensorflow/tfjs-node-gpu')
const {train} = require("@tensorflow/tfjs-core");
const fs = require('fs').promises;
let outputArray;
let inputArray;
let model;
const Status = {
    Ok: "ok",
    NotOk: "notok",
    SyntaxError: "syntaxerror"
}


 async function getData(){
    console.log("TEST")
     inputArray = eval(await fs.readFile('input.json', 'utf8'));
    console.log(inputArray)
    outputArray = eval(await fs.readFile('output.json', 'utf8'));

    return;
}



function generateRandom(){
    return Math.floor(Math.random() * 9) + 1;
}
async function trainModel() {
    console.log('twoja stara')
    // 1 to +, 2 to -, 3 to *, 4 to /
    const trainingDataset = {
        inputs: inputArray,
        outputs: outputArray, // corresponding outputs for the input sequences
        inputSize: 3, // Size of each input sequence
        outputSize: 15, // Number of possible outputs (adjust based on your needs)
    };

    //generateData()
    //await tf.setBackend('');

    const input = tf.input({ shape: [4] });
// Pierwsza warstwa gęsta z aktywacją ReLU
    const dense1 = tf.layers.dense({ units: 512, activation: 'relu',inputShape:[4] }).apply(input);

// Batch Normalization po pierwszej warstwie gęstej
    const batchNorm = tf.layers.batchNormalization({units:8, axis: 1,inputShape:[512], activation: 'relu' }).apply(dense1);

// Druga warstwa gęsta
    const dense2 = tf.layers.dense({ inputShape:[8],units: 512, activation: 'relu' }).apply(batchNorm);
    const dense3 = tf.layers.dense({ inputShape:[512],units: 7}).apply(dense2);

    // Model funkcyjny
    model  = tf.model({ inputs: input, outputs: [dense3] });
    model.summary()
    // Compile the model
    await model.compile({
        optimizer: 'adam', //sgd
        loss: 'meanSquaredError',
        metrics: ['accuracy']

    });

    // Convert input and output data to tensors

    console.log(trainingDataset.outputs.length)

    const xs = tf.tensor2d(trainingDataset.inputs, [5040 ,4]);
    const ys = tf.tensor3d(trainingDataset.outputs, [5040, 100, 7])

    const epochs = 10

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
    const modelJSON = await model.toJSON();
    const modelData = Buffer.from(JSON.stringify(modelJSON));

   // await model.save('file://model.tfjs', { saveFormat: 'tfjs' });
    await model.save('file://my-model');

}
async function loadModel(){
const model = await tf.loadLayersModel('file://my-model/model.json');
    console.log(await model.predict(tf.tensor2d([1,2,3,4], [1, 4])).dataSync()[0])
    console.log(Math.round(await model.predict(tf.tensor2d([1,2,3,4], [1, 4])).dataSync()[0]))
}
app.get("/train", async function (req, res) {
    await getData();

    await trainModel();
    res.send("Hey, I am responding to your request!");

});
app.get("/load", async function (req, res) {
    await loadModel();
    res.send("Hey, I am responding to your request!");
});
app.listen(3000, function () {
    console.log("App listening on port 3000!");
});