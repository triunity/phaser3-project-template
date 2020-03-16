import Phaser from 'phaser';

import sky from '@/assets/sky.png';
import ground from '@/assets/platform.png';
import star from '@/assets/star.png';
import bomb from '@/assets/bomb.png';
import dude from '@/assets/dude.png';
import coin from '@/assets/coin.mp3';
import jumpsmall from '@/assets/jumpsmall.mp3';
import jumpsuper from '@/assets/jumpsuper.mp3';

export default {
  type: Phaser.AUTO,
  width: 650,
  height: 450,
  physics: {
    default: 'arcade',
    arcade: {
        gravity: { y: 300 },
        debug: false
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

function preload() {
  this.load.image('sky', sky);
  this.load.image('ground', ground);
  this.load.image('star', star);
  this.load.image('bomb', bomb);
  this.load.spritesheet('dude', dude, { frameWidth: 32, frameHeight: 48 });

  this.load.audio('coin', coin);
  this.load.audio('jumpsmall', jumpsmall);
  this.load.audio('jumpsuper', jumpsuper);
}

var player;
var platforms;
var cursors;
var stars;
var bombs;

var jumpDuration = 0;
var isJumpSmall = true;
var isJumpSuper = true;

var score = 0;
var scoreText;
var life = 3;
var lifeText;
var gameOver = false;

function create() {
  this.add.image(0, 0, 'sky').setOrigin(0, 0);

  platforms = this.physics.add.staticGroup();

  platforms.create(400, 568, 'ground').setScale(2).refreshBody();
  platforms.create(600, 400, 'ground');
  platforms.create(50, 250, 'ground');
  platforms.create(750, 220, 'ground');

  player = this.physics.add.sprite(26, 450, 'dude');

  player.body.setGravityY(300);

  player.setBounce(0.2);
  player.setCollideWorldBounds(true);

  this.anims.create({
    key: 'left',
    frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1
  });

  this.anims.create({
    key: 'turn',
    frames: [ { key: 'dude', frame: 4 } ],
    frameRate: 20
  });

  this.anims.create({
    key: 'right',
    frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
    frameRate: 10,
    repeat: -1
  });

  stars = this.physics.add.group({
    key: 'star',
    repeat: 11,
    setXY: { x: 12, y: 0, stepX: 70 }
  });

  stars.children.iterate(function (child) {
    child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
  });

  bombs = this.physics.add.group();

  cursors = this.input.keyboard.createCursorKeys();

  this.physics.add.collider(player, platforms);
  this.physics.add.collider(stars, platforms);
  this.physics.add.collider(bombs, platforms);

  this.physics.add.overlap(player, stars, collectStar, null, this);
  this.physics.add.overlap(player, bombs, hitBomb, null, this);

  this.cameras.main.setBounds(0, 0, 800, 600);
  this.physics.world.setBounds(0, 0, 800, 600);
  this.cameras.main.startFollow(player, true, 0.08, 0.08);
  
  scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#000' });
  scoreText.setScrollFactor(0);
  lifeText = this.add.text(500, 16, 'Life: 3', { fontSize: '32px', fill: '#f00' });
  lifeText.setScrollFactor(0);

  this.coinMusic = this.sound.add('coin');
  this.jumpsmallMusic = this.sound.add('jumpsmall');
  this.jumpsuperMusic = this.sound.add('jumpsuper');
}

function update() {
  if (gameOver) {
    return;
  }

  if (cursors.left.isDown) {
    player.setVelocityX(-240);

    player.anims.play('left', true);
  } else if (cursors.right.isDown) {
    player.setVelocityX(240);

    player.anims.play('right', true);
  } else {
    player.setVelocityX(0);

    player.anims.play('turn');
  }

  if (cursors.up.isDown && player.body.touching.down && jumpDuration === 0) {
    jumpDuration = 1;

    player.setVelocityY(-180);
  } else if (cursors.up.isDown && jumpDuration > 0 && jumpDuration <= 30) {
    jumpDuration++;

    player.setVelocityY(-180 - jumpDuration * 3);

    this.time.delayedCall(200, function () {
      if (jumpDuration > 12) {
        if (isJumpSuper) {
          this.jumpsuperMusic.play({ volume: 0.1 });
          isJumpSuper = false;
          isJumpSmall = false;
        }
      }

      if (isJumpSmall) {
        this.jumpsmallMusic.play({ volume: 0.1 });
        isJumpSmall = false;
      }
    }, null, this);
  } else {
    jumpDuration = 0;
  }

  if (player.body.touching.down) {
    isJumpSmall = true;
    isJumpSuper = true;
  }
}

function collectStar (player, star) {
  this.coinMusic.play({ volume: 0.1 });

  star.disableBody(true, true);

  score += 10;
  scoreText.setText('Score: ' + score);

  if (stars.countActive(true) === 0) {
    stars.children.iterate(function (child) {
      child.enableBody(true, child.x, 0, true, true);
    });

    var x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

    var bomb = bombs.create(x, 16, 'bomb');
    bomb.setBounce(1);
    bomb.setCollideWorldBounds(true);
    bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
    bomb.body.setGravityY(500);
  }
}

function hitBomb (player, bomb) {
  player.setTint(0xff0000);

  life -= 1;
  lifeText.setText('Life: ' + life);

  if (life === 0) {
    this.physics.pause();
    player.anims.play('turn');

    gameOver = true;
  } else {
    bomb.disableBody(true, true);

    setTimeout(function () {
      player.clearTint();
    }, 1000)
  }
}
