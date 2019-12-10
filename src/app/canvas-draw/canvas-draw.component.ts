import { Component, OnInit, Renderer2, AfterViewInit, HostListener } from '@angular/core';
import { Platform } from '@ionic/angular';

import * as tf from '@tensorflow/tfjs';

@Component({
  selector: 'app-canvas-draw',
  templateUrl: './canvas-draw.component.html',
  styleUrls: ['./canvas-draw.component.scss'],
})
export class CanvasDrawComponent implements OnInit, AfterViewInit {

  canvasElement: any;
  pos = { x: 0, y: 0 };

  currentColour = '#1abc9c';
  availableColours: any;
  brushSize = 10;

  /** Canvas 2d context */
  private context: CanvasRenderingContext2D;

  model: tf.LayersModel;
  predictions: any;
  predictedNumber: string;

  constructor(public platform: Platform, public renderer: Renderer2) {
    console.log('Hello CanvasDrawComponent');
    console.log('Aquí se va a integrar un modelo de tensorflow para entender números');

    this.availableColours = [
      '#1abc9c',
      '#3498db',
      '#9b59b6',
      '#e67e22',
      '#e74c3c'
    ];
  }

  ngOnInit() {
    this.loadModel();
  }

  async loadModel() {
    this.model = await tf.loadLayersModel('../../assets/model.json');
  }

  ngAfterViewInit() {

    this.canvasElement = this.renderer.selectRootElement('canvas');

    this.renderer.setAttribute(this.canvasElement, 'width', this.platform.width() + '');
    this.renderer.setAttribute(this.canvasElement, 'height', this.platform.height() + '');

    /* this.context = (this.canvas.nativeElement as HTMLCanvasElement).getContext('2d'); */

    this.context = (this.canvasElement).getContext('2d');
    //this.draw();

  }

  @HostListener('mouseup', ['$event'])
  async onUp(e) {
    /* const scaled = this.context.drawImage(this.canvasElement, 0, 0, 28, 28); */
    const imageData = this.context.getImageData(0, 0, this.canvasElement.width, this.canvasElement.height);

    const pred = await tf.tidy(() => {

      // Convert the canvas pixels to a Tensor of the matching shape
      let img = tf.browser.fromPixels(imageData, 1)
      .resizeNearestNeighbor([28, 28]) // Shape: (28, 28, 3) - RGB image
      .mean(2) // Shape: (28, 28) - grayscale
      .expandDims(2) // Shape: (28, 28, 1) - network expects 3d values with channels in the last dimension
      .expandDims() // Shape: (1, 28, 28, 1) - network makes predictions for "batches" of images
      .toFloat() // Network works with floating points inputs
      .div(255.0); // Normalize [0..255] values into [0..1] range
      console.log(img.shape);

      // Make and format the predications
      const output = this.model.predict(img) as any;

      console.log(output.data());
      // Save predictions on the component
      this.predictions = Array.from(output.data());
      this.predictedNumber = this.predictions.indexOf(Math.max(...this.predictions));
      console.log(this.predictedNumber);

/*       for (let i = 0; i < this.predictions.length; i++) {
        if (this.predictions[i] === '1') {
          this.predictedNumber = i.toString();
        }
      }
      if (this.predictedNumber === '') {
        this.predictedNumber = ':(';
      } */
    });

  }

  @HostListener('mouseenter', ['$event'])
  onEnter(e) {
    this.setPosition(e);
  }

  @HostListener('mousedown', ['$event'])
  onMove(e) {
    this.setPosition(e);
  }

  @HostListener('mousemove', ['$event'])
  onDown(e) {

    if (e.buttons !== 1) {
      return;
    }

    this.context.beginPath(); // begin

    this.context.lineWidth = 10;
    this.context.lineCap = 'round';
    this.context.strokeStyle = '#111111';

    this.context.moveTo(this.pos.x, this.pos.y);
    this.setPosition(e);
    this.context.lineTo(this.pos.x, this.pos.y);

    this.context.stroke();
  }

  @HostListener('resize', ['$event'])
  onResize(e) {
    this.context.canvas.width = window.innerWidth;
    this.context.canvas.height = window.innerHeight;
  }

  setPosition(e) {
    this.pos.x = e.offsetX;
    this.pos.y = e.offsetY;
  }

  changeColour(colour) {
    this.currentColour = colour;
  }

  changeSize(size) {
    this.brushSize = size;
  }

  clearCanvas() {
    this.context = (this.canvasElement).getContext('2d');
    this.context.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
  }


}
