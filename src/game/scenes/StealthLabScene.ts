import Phaser from 'phaser'
import {
  calculateExposure,
  calculateNoiseRadius,
  nextDetectionLevel,
  type MovementMode,
} from '../domain/stealthRules'

const WORLD_WIDTH = 2560
const WORLD_HEIGHT = 720
const FLOOR_Y = 654
const PLAYER_SPEED = 215
const SPRINT_SPEED = 340
const GUARD_SPEED = 105

type GuardMode = 'patrol' | 'investigate' | 'alert'

interface Guard {
  body: Phaser.Physics.Arcade.Body
  direction: 1 | -1
  label: Phaser.GameObjects.Text
  mode: GuardMode
  patrolEnd: number
  patrolStart: number
  sprite: Phaser.GameObjects.Rectangle
  targetX: number | null
  detection: number
}

interface NoisePulse {
  age: number
  radius: number
  x: number
  y: number
}

interface ShadowZone {
  end: number
  start: number
}

export class StealthLabScene extends Phaser.Scene {
  private aimGraphics!: Phaser.GameObjects.Graphics
  private alertText!: Phaser.GameObjects.Text
  private crouching = false
  private dataCollected = false
  private door!: Phaser.GameObjects.Rectangle
  private doorBody!: Phaser.Physics.Arcade.StaticBody
  private doorOpen = false
  private exposureText!: Phaser.GameObjects.Text
  private extractionZone!: Phaser.GameObjects.Zone
  private generator!: Phaser.GameObjects.Rectangle
  private guards: Guard[] = []
  private hasLost = false
  private hasWon = false
  private hudMessage!: Phaser.GameObjects.Text
  private interactionText!: Phaser.GameObjects.Text
  private keys!: {
    crouch: Phaser.Input.Keyboard.Key
    interact: Phaser.Input.Keyboard.Key
    jump: Phaser.Input.Keyboard.Key
    left: Phaser.Input.Keyboard.Key
    restart: Phaser.Input.Keyboard.Key
    right: Phaser.Input.Keyboard.Key
    run: Phaser.Input.Keyboard.Key
  }
  private lightsEnabled = true
  private nextFootstepAt = 0
  private noiseGraphics!: Phaser.GameObjects.Graphics
  private noisePulses: NoisePulse[] = []
  private player!: Phaser.GameObjects.Rectangle
  private playerBody!: Phaser.Physics.Arcade.Body
  private playerMovement: MovementMode = 'idle'
  private platformBodies: Phaser.Physics.Arcade.StaticBody[] = []
  private shadowZones: ShadowZone[] = [
    { start: 520, end: 840 },
    { start: 1470, end: 1740 },
  ]
  private terminal!: Phaser.GameObjects.Rectangle
  private worldLights: Phaser.GameObjects.Shape[] = []

  public constructor() {
    super('stealth-lab')
  }

  public create(): void {
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)

    this.createEnvironment()
    this.createPlayer()
    this.createGuards()
    this.createHud()
    this.createInput()

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12)
    this.cameras.main.setFollowOffset(-120, 40)
    this.hudMessage.setText('Objectif : récupérer les données au terminal, puis rejoindre l’extraction.')
  }

  public override update(_time: number, delta: number): void {
    if (this.hasLost || this.hasWon) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.restart)) {
        this.scene.restart()
      }

      return
    }

    this.updatePlayer()
    this.updateInteractions()
    this.updateNoise(delta)
    this.updateGuards(delta)
    this.updateAim()
    this.updateHud()

    if (this.dataCollected && this.player.x > this.extractionZone.x - 45) {
      this.finishMission(true)
    }
  }

  private createEnvironment(): void {
    this.add.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT, 0x071027)

    for (let index = 0; index < 12; index += 1) {
      const x = 140 + index * 230
      const height = 210 + ((index * 47) % 170)
      this.add.rectangle(x, 500 - height / 2, 150, height, 0x102c4b, 0.9).setDepth(0)
      this.add.rectangle(x, 500 - height - 12, 94, 12, 0x244b68, 0.8).setDepth(0)
    }

    this.add.rectangle(WORLD_WIDTH / 2, 698, WORLD_WIDTH, 44, 0x0a1221).setDepth(1)
    this.add.rectangle(WORLD_WIDTH / 2, FLOOR_Y, WORLD_WIDTH, 58, 0x1a2534).setDepth(2)
    this.add.rectangle(WORLD_WIDTH / 2, FLOOR_Y - 30, WORLD_WIDTH, 4, 0x5e7080).setDepth(3)
    this.add.rectangle(WORLD_WIDTH / 2, FLOOR_Y - 22, WORLD_WIDTH, 2, 0xffb957, 0.65).setDepth(3)

    this.addPlatform(WORLD_WIDTH / 2, FLOOR_Y, WORLD_WIDTH, 58)
    this.addPlatform(375, 500, 250, 22)
    this.addPlatform(1120, 495, 230, 22)
    this.addPlatform(2010, 500, 290, 22)

    this.createShadowZone(520, 840)
    this.createShadowZone(1470, 1740)
    this.createLight(360, 330)
    this.createLight(1000, 300)
    this.createLight(1610, 310)
    this.createLight(2200, 320)

    this.generator = this.add.rectangle(760, 584, 58, 106, 0x2bb6bd).setStrokeStyle(3, 0xc5fffb)
    this.add.text(716, 500, 'GÉNÉRATEUR', { fontFamily: 'monospace', fontSize: '14px', color: '#bffbfb' })

    this.door = this.add.rectangle(1330, 574, 36, 120, 0xae4556).setStrokeStyle(3, 0xffb957)
    this.physics.add.existing(this.door, true)
    this.doorBody = this.door.body as Phaser.Physics.Arcade.StaticBody
    this.add.text(1292, 500, 'PORTE', { fontFamily: 'monospace', fontSize: '14px', color: '#ffc273' })

    this.terminal = this.add.rectangle(1855, 578, 72, 92, 0x604fbc).setStrokeStyle(3, 0xd7ceff)
    this.add.text(1806, 495, 'TERMINAL', { fontFamily: 'monospace', fontSize: '14px', color: '#d7ceff' })

    this.extractionZone = this.add.zone(2390, 580, 96, 150)
    this.add.rectangle(2390, 580, 80, 128, 0x1c4f61, 0.8).setStrokeStyle(3, 0x67e0dd)
    this.add.text(2330, 498, 'EXTRACTION', { fontFamily: 'monospace', fontSize: '14px', color: '#8ff6ef' })

    this.noiseGraphics = this.add.graphics().setDepth(12)
    this.aimGraphics = this.add.graphics().setDepth(20)
  }

  private createPlayer(): void {
    this.player = this.add.rectangle(120, 570, 32, 62, 0x6ff7ec).setStrokeStyle(3, 0xe7ffff)
    this.player.setDepth(14)
    this.physics.add.existing(this.player)
    this.playerBody = this.player.body as Phaser.Physics.Arcade.Body
    this.playerBody.setCollideWorldBounds(true)
    this.playerBody.setDragX(1600)
    this.playerBody.setMaxVelocity(SPRINT_SPEED, 800)

    this.platformBodies.forEach((platform) => {
      this.physics.add.collider(this.player, platform.gameObject)
    })
    this.physics.add.collider(this.player, this.door)
  }

  private createGuards(): void {
    this.guards = [
      this.createGuard(1040, 565, 930, 1240),
      this.createGuard(1640, 565, 1510, 1940),
    ]
  }

  private createGuard(x: number, y: number, patrolStart: number, patrolEnd: number): Guard {
    const sprite = this.add.rectangle(x, y, 34, 68, 0xffb957).setStrokeStyle(3, 0x201b27)
    sprite.setDepth(13)
    this.physics.add.existing(sprite)
    const body = sprite.body as Phaser.Physics.Arcade.Body
    body.setCollideWorldBounds(true)
    body.setDragX(800)

    this.platformBodies.forEach((platform) => {
      this.physics.add.collider(sprite, platform.gameObject)
    })
    this.physics.add.collider(sprite, this.door)

    const label = this.add
      .text(x - 34, y - 62, 'PATROUILLE', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#ffe0a9',
      })
      .setDepth(16)

    return {
      body,
      direction: 1,
      label,
      mode: 'patrol',
      patrolEnd,
      patrolStart,
      sprite,
      targetX: null,
      detection: 0,
    }
  }

  private createHud(): void {
    const hudStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#d9f5f7',
      stroke: '#071027',
      strokeThickness: 5,
    }

    this.exposureText = this.add.text(28, 22, '', hudStyle).setScrollFactor(0).setDepth(30)
    this.alertText = this.add.text(28, 50, '', hudStyle).setScrollFactor(0).setDepth(30)
    this.hudMessage = this.add
      .text(28, 80, '', {
        ...hudStyle,
        fontSize: '15px',
        wordWrap: { width: 760 },
      })
      .setScrollFactor(0)
      .setDepth(30)
    this.interactionText = this.add
      .text(640, 662, '', {
        ...hudStyle,
        color: '#ffdf9c',
        fontSize: '16px',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(30)

    this.add
      .text(1250, 22, 'A/D : déplacement · ESPACE : saut · MAJ : courir · S : se cacher · E : interagir · clic : diversion', {
        ...hudStyle,
        fontSize: '13px',
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(30)
  }

  private createInput(): void {
    const keyboard = this.input.keyboard

    if (keyboard === null) {
      throw new Error('Keyboard input is required for Shadowline V1.')
    }

    this.keys = keyboard.addKeys({
      crouch: Phaser.Input.Keyboard.KeyCodes.S,
      interact: Phaser.Input.Keyboard.KeyCodes.E,
      jump: Phaser.Input.Keyboard.KeyCodes.SPACE,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      restart: Phaser.Input.Keyboard.KeyCodes.R,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      run: Phaser.Input.Keyboard.KeyCodes.SHIFT,
    }) as typeof this.keys

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.hasLost || this.hasWon) {
        return
      }

      this.emitNoise(pointer.worldX, pointer.worldY, 300, 'Diversion lancée')
    })
  }

  private createLight(x: number, y: number): void {
    const halo = this.add.circle(x, y, 140, 0xffbd5d, 0.09).setDepth(5)
    const lamp = this.add.rectangle(x, y - 122, 36, 10, 0xffda9a).setDepth(7)
    this.worldLights.push(halo, lamp)
  }

  private createShadowZone(start: number, end: number): void {
    this.add
      .rectangle((start + end) / 2, 556, end - start, 200, 0x02050d, 0.56)
      .setDepth(6)
      .setBlendMode(Phaser.BlendModes.MULTIPLY)
  }

  private addPlatform(x: number, y: number, width: number, height: number): void {
    const platform = this.add.rectangle(x, y, width, height, 0x1a2534).setVisible(false)
    this.physics.add.existing(platform, true)
    this.platformBodies.push(platform.body as Phaser.Physics.Arcade.StaticBody)
  }

  private updatePlayer(): void {
    const moveDirection = Number(this.keys.right.isDown) - Number(this.keys.left.isDown)
    const grounded = this.playerBody.blocked.down || this.playerBody.touching.down

    this.crouching = this.keys.crouch.isDown && grounded
    const running = this.keys.run.isDown && !this.crouching && moveDirection !== 0
    const speed = running ? SPRINT_SPEED : PLAYER_SPEED
    this.playerMovement = moveDirection === 0 ? 'idle' : running ? 'sprint' : 'walk'

    this.playerBody.setVelocityX(moveDirection * speed)
    this.player.setScale(1, this.crouching ? 0.72 : 1)

    if (Phaser.Input.Keyboard.JustDown(this.keys.jump) && grounded && !this.crouching) {
      this.playerBody.setVelocityY(-540)
      this.emitNoise(this.player.x, this.player.y, 190, 'Réception prévue : mouvement détectable')
    }

    if (grounded && this.playerMovement !== 'idle') {
      const interval = this.playerMovement === 'sprint' ? 300 : 700
      const now = this.time.now

      if (now >= this.nextFootstepAt) {
        const radius = calculateNoiseRadius({
          crouching: this.crouching,
          movement: this.playerMovement,
          surfaceMultiplier: 1.2,
        })

        if (radius > 0) {
          this.emitNoise(this.player.x, this.player.y, radius)
        }

        this.nextFootstepAt = now + interval
      }
    }
  }

  private updateInteractions(): void {
    const nearGenerator = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.generator.x, this.generator.y) < 90
    const nearDoor = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.door.x, this.door.y) < 90
    const nearTerminal = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.terminal.x, this.terminal.y) < 110

    if (nearGenerator) {
      this.interactionText.setText('[E] couper / rétablir le courant')
    } else if (nearDoor && !this.doorOpen) {
      this.interactionText.setText('[E] déverrouiller la porte')
    } else if (nearTerminal && !this.dataCollected) {
      this.interactionText.setText('[E] récupérer les données')
    } else {
      this.interactionText.setText('')
    }

    if (!Phaser.Input.Keyboard.JustDown(this.keys.interact)) {
      return
    }

    if (nearGenerator) {
      this.lightsEnabled = !this.lightsEnabled
      this.worldLights.forEach((light) => light.setVisible(this.lightsEnabled))
      this.generator.setFillStyle(this.lightsEnabled ? 0x2bb6bd : 0x23384b)
      this.hudMessage.setText(this.lightsEnabled ? 'Courant rétabli : la zone redevient visible.' : 'Courant coupé : les ombres réduisent votre exposition.')
      this.emitNoise(this.generator.x, this.generator.y, 210, 'Le générateur a claqué')
      return
    }

    if (nearDoor && !this.doorOpen) {
      this.doorOpen = true
      this.door.setVisible(false)
      this.doorBody.enable = false
      this.hudMessage.setText('Porte déverrouillée. Le couloir de service est accessible.')
      this.emitNoise(this.door.x, this.door.y, 135, 'Porte ouverte')
      return
    }

    if (nearTerminal && !this.dataCollected) {
      this.dataCollected = true
      this.terminal.setFillStyle(0x67e0dd)
      this.hudMessage.setText('Données récupérées. Rejoignez le train d’extraction à droite.')
      return
    }

    this.hudMessage.setText('Aucune interaction utilisable ici.')
  }

  private updateGuards(delta: number): void {
    const elapsedSeconds = delta / 1000
    const exposure = this.getExposure()

    this.guards.forEach((guard) => {
      const horizontalDistance = this.player.x - guard.sprite.x
      const verticalDistance = Math.abs(this.player.y - guard.sprite.y)
      const playerInFront = horizontalDistance * guard.direction > 0
      const playerAcrossClosedDoor = !this.doorOpen && ((guard.sprite.x < this.door.x && this.player.x > this.door.x) || (guard.sprite.x > this.door.x && this.player.x < this.door.x))
      const canSeePlayer = Math.abs(horizontalDistance) < 330 && verticalDistance < 110 && playerInFront && !playerAcrossClosedDoor

      guard.detection = nextDetectionLevel(guard.detection, exposure, canSeePlayer, elapsedSeconds)

      if (guard.detection > 0.95) {
        guard.mode = 'alert'
        guard.targetX = this.player.x
      } else if (guard.detection > 0.35 && guard.mode === 'patrol') {
        guard.mode = 'investigate'
        guard.targetX = this.player.x
      }

      this.moveGuard(guard)
      this.renderGuardState(guard)

      if (guard.mode === 'alert' && Phaser.Math.Distance.Between(this.player.x, this.player.y, guard.sprite.x, guard.sprite.y) < 52) {
        this.finishMission(false)
      }
    })
  }

  private moveGuard(guard: Guard): void {
    if (guard.mode === 'alert') {
      guard.targetX = this.player.x
    }

    if (guard.mode === 'patrol') {
      if (guard.sprite.x <= guard.patrolStart) {
        guard.direction = 1
      } else if (guard.sprite.x >= guard.patrolEnd) {
        guard.direction = -1
      }

      guard.body.setVelocityX(guard.direction * GUARD_SPEED)
    } else if (guard.targetX !== null) {
      const distance = guard.targetX - guard.sprite.x

      if (Math.abs(distance) < 10 && guard.mode === 'investigate') {
        guard.mode = 'patrol'
        guard.targetX = null
      } else {
        guard.direction = distance >= 0 ? 1 : -1
        guard.body.setVelocityX(guard.direction * (guard.mode === 'alert' ? GUARD_SPEED * 1.45 : GUARD_SPEED * 1.12))
      }
    }

    guard.label.setPosition(guard.sprite.x - 35, guard.sprite.y - 62)
  }

  private renderGuardState(guard: Guard): void {
    const stateVisuals: Record<GuardMode, { color: number; label: string; textColor: string }> = {
      patrol: { color: 0xffb957, label: 'PATROUILLE', textColor: '#ffe0a9' },
      investigate: { color: 0xffd66a, label: 'ENQUÊTE', textColor: '#ffe7a8' },
      alert: { color: 0xff5b6d, label: 'ALERTE', textColor: '#ff8790' },
    }
    const visual = stateVisuals[guard.mode]

    guard.sprite.setFillStyle(visual.color)
    guard.label.setText(visual.label).setColor(visual.textColor)
  }

  private updateNoise(delta: number): void {
    this.noisePulses.forEach((pulse) => {
      pulse.age += delta
    })
    this.noisePulses = this.noisePulses.filter((pulse) => pulse.age < 650)

    this.noiseGraphics.clear()
    this.noisePulses.forEach((pulse) => {
      const progress = pulse.age / 650
      this.noiseGraphics.lineStyle(2, 0xffb957, 1 - progress)
      this.noiseGraphics.strokeCircle(pulse.x, pulse.y, pulse.radius * progress)
    })
  }

  private updateAim(): void {
    const pointer = this.input.activePointer
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y - 12, pointer.worldX, pointer.worldY)
    const endX = this.player.x + Math.cos(angle) * 70
    const endY = this.player.y - 12 + Math.sin(angle) * 70

    this.aimGraphics.clear()
    this.aimGraphics.lineStyle(2, 0x8ff6ef, 0.8)
    this.aimGraphics.lineBetween(this.player.x, this.player.y - 12, endX, endY)
  }

  private updateHud(): void {
    const exposure = this.getExposure()
    const alertingGuards = this.guards.filter((guard) => guard.mode === 'alert').length
    const investigatingGuards = this.guards.filter((guard) => guard.mode === 'investigate').length
    const alert = alertingGuards > 0 ? 'ALERTE' : investigatingGuards > 0 ? 'SUSPICION' : 'CALME'
    const alertColor = alertingGuards > 0 ? '#ff8790' : investigatingGuards > 0 ? '#ffe7a8' : '#8ff6ef'

    this.exposureText.setText(`EXPOSITION  ${Math.round(exposure * 100)}%`)
    this.alertText.setText(`ÉTAT  ${alert}`).setColor(alertColor)
  }

  private getExposure(): number {
    return calculateExposure({
      crouching: this.crouching,
      inShadow: this.shadowZones.some((zone) => this.player.x >= zone.start && this.player.x <= zone.end),
      lightsEnabled: this.lightsEnabled,
      movement: this.playerMovement,
    })
  }

  private emitNoise(x: number, y: number, radius: number, message?: string): void {
    this.noisePulses.push({ age: 0, radius, x, y })
    this.guards.forEach((guard) => {
      if (guard.mode === 'alert') {
        return
      }

      if (Phaser.Math.Distance.Between(x, y, guard.sprite.x, guard.sprite.y) <= radius) {
        guard.mode = 'investigate'
        guard.targetX = x
      }
    })

    if (message !== undefined) {
      this.hudMessage.setText(message)
    }
  }

  private finishMission(success: boolean): void {
    this.hasWon = success
    this.hasLost = !success
    this.playerBody.setVelocity(0, 0)
    this.guards.forEach((guard) => guard.body.setVelocity(0, 0))

    const title = success ? 'MISSION RÉUSSIE' : 'MISSION COMPROMISE'
    const subtitle = success
      ? 'Les données sont exfiltrées. Appuyez sur R pour recommencer.'
      : 'Un garde vous a intercepté. Appuyez sur R pour recommencer.'
    const color = success ? '#8ff6ef' : '#ff8790'

    this.add.rectangle(640, 360, 760, 220, 0x071027, 0.94).setStrokeStyle(3, success ? 0x67e0dd : 0xff5b6d).setDepth(40)
    this.add
      .text(640, 326, title, {
        fontFamily: 'monospace',
        fontSize: '42px',
        color,
      })
      .setOrigin(0.5)
      .setDepth(41)
    this.add
      .text(640, 390, subtitle, {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#eaf4f6',
      })
      .setOrigin(0.5)
      .setDepth(41)
  }
}
