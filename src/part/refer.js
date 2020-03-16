import Phaser from 'phaser';

import sky from '@/assets/sky.png';
import ground from '@/assets/platform.png';
import star from '@/assets/star.png';
import bomb from '@/assets/bomb.png';
import dude from '@/assets/dude.png';

export default {
  type: Phaser.AUTO,
  width: 650,
  height: 450,
  // parent: "ifierocom",
  physics: {
      default: 'arcade',
      arcade: {
          gravity: {
              y: 350
          },
          debug: false
      }
  },
  scene: {
      preload: preload,
      create: create,
      update: update
  }
};

var player;
var stars;
var bombs;
var platforms;
var cursors;
var score = 0;
var gameOver = false;
var scoreText;
// var jumpTimer = 0;
var isSmall = true;  // small jump  music
var isSuper = true;  // super jump  music

function init() {
  this.jumpTimer = 0;
  this.isCanJump = false;
  this.isCanLeft = false;
  this.isCanRight = false;
  this.isCanStand = true;
  this.velocityL = 0;
  this.velocityR = 0;
}

function preload() {
  this.load.image('sky', sky);
  this.load.image('ground', ground);
  this.load.image('star', star);
  this.load.image('bomb', bomb);
  this.load.spritesheet('dude', dude, {
      frameWidth: 32,
      frameHeight: 48
  });
  // this.load.spritesheet('mario', 'assets/mario_mario.png', {
  //     frameWidth: 16,
  //     frameHeight: 16,
  //     margin: 1,
  //     spacing: 1

  // });
  //music: small
  this.load.audio('jumpSmall', 'assets/audio/JumpSmall.mp3');
  //music: super
  this.load.audio('jumpSuper', 'assets/audio/JumpSuper.mp3');
  //music: super
  this.load.audio('coin', 'assets/audio/Coin.mp3');
}

function create() {
  this.spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  //  A simple background for our game
  this.add.image(400, 300, 'sky');

  //  The platforms group contains the ground and the 2 ledges we can jump on
  platforms = this.physics.add.staticGroup();

  //  Here we create the ground.
  //  Scale it to fit the width of the game (the original sprite is 400x32 in size)
  platforms.create(400, 568, 'ground').setScale(2).refreshBody();

  //  Now let's create some ledges
  platforms.create(600, 400, 'ground');
  platforms.create(50, 250, 'ground');
  platforms.create(750, 220, 'ground');

  // The player and its settings
  //  player = this.physics.add.sprite(100, 450, 'dude');
  player = this.physics.add.sprite(100, 450, 'mario', 0);
  player.setScale(2.5);

  //  Player physics properties. Give the little guy a slight bounce.
  player.setBounce(0.2);
  player.setCollideWorldBounds(true);

  //  Our player animations, turning, walking left and walking right.
  this.anims.create({
      key: 'run',
      frames: this.anims.generateFrameNumbers('mario', {
          start: 1,
          end: 3
      }),
      frameRate: 10,
      repeat: -1
  });

  this.anims.create({
      key: 'shift',
      frames: [{
          key: 'mario',
          frame: 4
      }],
      frameRate: 20
  });


  this.anims.create({
      key: 'stand',
      frames: [{
          key: 'mario',
          frame: 0
      }],
      frameRate: 20
  });

  this.anims.create({
      key: 'jump',
      frames: [{
          key: 'mario',
          frame: 5
      }],
      frameRate: 20
  });

  //  Input Events
  cursors = this.input.keyboard.createCursorKeys();

  //  Some stars to collect, 12 in total, evenly spaced 70 pixels apart along the x axis
  stars = this.physics.add.group({
      key: 'star',
      repeat: 11,
      setXY: {
          x: 12,
          y: 0,
          stepX: 70
      }
  });

  stars.children.iterate(function (child) {

      //  Give each star a slightly different bounce
      child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));

  });

  bombs = this.physics.add.group();

  //  The score
  scoreText = this.add.text(16, 16, 'score: 0', {
      fontSize: '32px',
      fill: '#000'
  });
  scoreText.setScrollFactor(0);
  //  Collide the player and the stars with the platforms
  this.physics.add.collider(player, platforms, function () {
      // console.log('hit ground');
      // console.groupEnd();
      this.isCanJump = false;
  }, null, this);
  this.physics.add.collider(stars, platforms);
  this.physics.add.collider(bombs, platforms);

  //  Checks to see if the player overlaps with any of the stars, if he does call the collectStar function
  this.physics.add.overlap(player, stars, collectStar, null, this);

  this.physics.add.collider(player, bombs, hitBomb, null, this);

  this.cameras.main.setBounds(0, 0, 800, 600);
  this.physics.world.setBounds(0, 0, 800, 600);
  this.cameras.main.startFollow(player, true, 0.08, 0.08);

  this.jumpSmallMusic = this.sound.add('jumpSmall');
  this.jumpSuperMusic = this.sound.add('jumpSuper');
  this.coinMusic = this.sound.add('coin');

  // 
  this.input.on('pointerdown', function () {});
}



function update() {
  if (gameOver) {
      return;
  }


  if (this.spaceBar.isDown) {
      this.isCanJump = true;
  }
  if (this.isCanJump) {
      //1. on the air
      player.anims.play('jump');

      if (player.body.velocity.x > 0) {
          if (cursors.left.isDown && player.body.velocity.x > -50) {
              player.body.velocity.x -= 10;
          }
      } else {
          if (cursors.right.isDown && player.body.velocity.x < 50) {
              player.body.velocity.x += 10;
          }
      }
      //  console.log("air player.velocity.x",player.body.velocity.x);

  } else {
      //2. on the ground 
      /* */
      if (cursors.left.isDown) {
          this.isCanLeft = true;
          this.isCanRight = false;
          player.setVelocityX(-160);
          player.setFlipX(true);
          player.anims.play('run', true);
      } else if (cursors.right.isDown) {
          this.isCanRight = true;
          this.isCanLeft = false;
          player.setVelocityX(160);
          player.setFlipX(false);
          player.anims.play('run', true);

      } else if (player.body.velocity.x === 0) {
          player.anims.play('stand', true);
      }

      //  player.setVelocityX(0);
      // dont left player stop immediately while relase arrow left/right
      if (this.isCanRight) {
          if (player.body.velocity.x > 0) {
              player.body.velocity.x -= 4;
              player.anims.play('run', true);
              this.velocityR = 1;
          }
          if (player.body.velocity.x < 0) {
              player.anims.play('stand', true);
              this.isCanRight = false;
              player.setVelocityX(0);
              player.body.velocity.x = 0;
              this.velocityR = 0;
          }
          console.log("ground RIGHT player.velocity.x", player.body.velocity.x);
      } else if (this.isCanLeft) {

          if (player.body.velocity.x < 0) {
              player.body.velocity.x += 4;
              player.anims.play('run', true);
          }
          if (player.body.velocity.x > 0) {
              player.anims.play('stand');
              this.isCanLeft = false;
              player.setVelocityX(0);
              player.body.velocity.x = 0

          }
          console.log("ground left player.velocity.x", player.body.velocity.x);
      }

      /* */


  }

  //MARK: -  Y position + music 
  if (this.spaceBar.isDown && player.body.touching.down && this.jumpTimer === 0) {
      this.jumpTimer = 1;
      // this.jumpSmallMusic.play({volume: 0.1});
      player.setVelocityY(-135);
  } else if (this.spaceBar.isDown && this.jumpTimer > 0 && this.jumpTimer <= 30) {

      this.jumpTimer++;
      player.setVelocityY(-135 - this.jumpTimer * 3);

      this.time.delayedCall(200, function () {
          // if jumpTimer > 12 ,play super music and set isSmall = false;
          if (this.jumpTimer > 12) {
              if (isSuper) {
                  isSuper = false;
                  isSmall = false;
                  this.jumpSuperMusic.play({
                      volume: 0.1
                  });
              }
          }
          if (isSmall) {
              this.jumpSmallMusic.play({
                  volume: 0.1
              });
              isSmall = false;
          }

      }, [], this);



  } else {
      this.jumpTimer = 0;
  }
  // 重新设置跳跃的声音
  if (player.body.touching.down) {
      isSmall = true;
      isSuper = true;
  }
}
//MARK:- collect star
function collectStar(player, star) {
  this.coinMusic.play({
      volume: 0.1
  });
  star.disableBody(true, true);

  //  Add and update the score
  score += 10;
  scoreText.setText('Score: ' + score);

  if (stars.countActive(true) === 0) {
      //  A new batch of stars to collect
      stars.children.iterate(function (child) {

          child.enableBody(true, child.x, 0, true, true);

      });

      var x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

      var bomb = bombs.create(x, 16, 'bomb');
      bomb.setBounce(1);
      bomb.setCollideWorldBounds(true);
      bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
      bomb.allowGravity = false;

  }
}
// MARK:- hit bomb
function hitBomb(player, bomb) {
  this.physics.pause();

  player.setTint(0xff0000);

  player.anims.play('stand');

  gameOver = true;
}
