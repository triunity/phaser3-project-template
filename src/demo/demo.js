import Phaser from "phaser";
import logoImg from "../assets/logo.png";

export default {
  type: Phaser.AUTO,
  parent: "phaser-example",
  width: '100%',
  height: '100%',
  scene: {
    preload: preload,
    create: create
  }
};

function preload() {
  this.load.image("logo", logoImg);
}

function create() {
  const logo = this.add.image(400, 150, "logo");

  this.tweens.add({
    targets: logo,
    y: 450,
    duration: 2000,
    ease: "Power2",
    yoyo: true,
    loop: -1
  });
}
