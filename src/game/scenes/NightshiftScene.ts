import Phaser from 'phaser'
import {
  calculateExposure,
  calculateNoiseRadius,
  nextDetectionLevel,
  type MovementMode,
} from '../domain/stealthRules'

const VIEWPORT_WIDTH = 1280
const VIEWPORT_HEIGHT = 720
const FLOOR_LINES = [650, 479, 343, 216]
const WALK_SPEED = 178
const CRAWL_SPEED = 88
const CLIMB_SPEED = 176

type AlertState = 'calm' | 'suspicion' | 'alarm'
type GuardState = 'patrol' | 'investigate' | 'alert' | 'down'

interface Guard {
  body: Phaser.Physics.Arcade.Body
  detection: number
  direction: 1 | -1
  label: Phaser.GameObjects.Text
  patrolEnd: number
  patrolStart: number
  sprite: Phaser.Physics.Arcade.Sprite
  state: GuardState
  targetX: number | null
}

interface SecurityCamera {
  detection: number
  direction: 1 | -1
  floorY: number
  range: number
  sprite: Phaser.GameObjects.Sprite
}

interface ClimbZone {
  label: string
  x: number
  yMax: number
  yMin: number
}

interface NoisePulse {
  age: number
  radius: number
  x: number
  y: number
}

interface Projectile {
  life: number
  object: Phaser.GameObjects.Rectangle
  vx: number
  vy: number
}

interface Interaction {
  action: () => void
  label: string
}

interface ShadowPatch {
  height: number
  width: number
  x: number
  y: number
}

export class NightshiftScene extends Phaser.Scene {
  private alarmDisabled = false
  private alertState: AlertState = 'calm'
  private aimGraphics!: Phaser.GameObjects.Graphics
  private securityCameras: SecurityCamera[] = []
  private climbZones: ClimbZone[] = [
    { label: 'Escalier ouest', x: 204, yMin: 175, yMax: 638 },
    { label: 'Échelle archives', x: 484, yMin: 309, yMax: 467 },
    { label: 'Échelle maintenance', x: 721, yMin: 446, yMax: 638 },
    { label: 'Échelle technique', x: 720, yMin: 178, yMax: 332 },
    { label: 'Escalier extérieur', x: 1158, yMin: 174, yMax: 638 },
  ]
  private currentClimbZone: ClimbZone | null = null
  private exitBeacon!: Phaser.GameObjects.Arc
  private exitDoor!: Phaser.GameObjects.Rectangle
  private exitDoorBody!: Phaser.Physics.Arcade.StaticBody
  private exitDoorOpen = false
  private floorPlatforms: Phaser.GameObjects.Rectangle[] = []
  private fovGraphics!: Phaser.GameObjects.Graphics
  private guards: Guard[] = []
  private hasKeycard = false
  private hasLost = false
  private hasWon = false
  private hudAlert!: Phaser.GameObjects.Text
  private hudObjective!: Phaser.GameObjects.Text
  private hudWeapon!: Phaser.GameObjects.Text
  private interactionText!: Phaser.GameObjects.Text
  private isClimbing = false
  private keycard!: Phaser.GameObjects.Container
  private keys!: {
    crouch: Phaser.Input.Keyboard.Key
    interact: Phaser.Input.Keyboard.Key
    jump: Phaser.Input.Keyboard.Key
    left: Phaser.Input.Keyboard.Key
    right: Phaser.Input.Keyboard.Key
    up: Phaser.Input.Keyboard.Key
    weapon: Phaser.Input.Keyboard.Key
  }
  private nextDecoyAt = 0
  private nextFootstepAt = 0
  private nextShotAt = 0
  private noiseGraphics!: Phaser.GameObjects.Graphics
  private noisePulses: NoisePulse[] = []
  private player!: Phaser.Physics.Arcade.Sprite
  private playerBody!: Phaser.Physics.Arcade.Body
  private playerCrouching = false
  private playerMovement: MovementMode = 'idle'
  private projectiles: Projectile[] = []
  private securityConsole!: Phaser.GameObjects.Container
  private shadowPatches: ShadowPatch[] = [
    { x: 382, y: 312, width: 190, height: 58 },
    { x: 725, y: 450, width: 176, height: 58 },
    { x: 902, y: 617, width: 164, height: 58 },
  ]
  private toast!: Phaser.GameObjects.Text
  private ventEntry!: Phaser.GameObjects.Container
  private weaponEquipped = false

  public constructor() {
    super('nightshift')
  }

  public preload(): void {
    this.load.svg('nightshift-building', 'art/nightshift-building-v1.svg', { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT })
  }

  public create(): void {
    this.cameras.main.setBackgroundColor('#020712')
    this.cameras.main.setBounds(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT)
    this.physics.world.setBounds(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT)
    this.input.mouse?.disableContextMenu()

    this.add.image(VIEWPORT_WIDTH / 2, VIEWPORT_HEIGHT / 2, 'nightshift-building').setDisplaySize(VIEWPORT_WIDTH, VIEWPORT_HEIGHT)
    this.createPixelTextures()
    this.createMoodLayers()
    this.createPlatforms()
    this.createInteractables()
    this.createPlayer()
    this.createGuards()
    this.createCameras()
    this.createInput()
    this.createHud()

    this.showToast('OBJECTIF : de A à B. Trouvez votre route vers l’extraction au toit.', 4600)
  }

  public override update(_time: number, delta: number): void {
    if (this.hasLost || this.hasWon) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.interact)) {
        this.scene.restart()
      }

      return
    }

    this.updatePlayer()
    this.updateWeapon()
    this.updateInteractions()
    this.updateNoise(delta)
    this.updateProjectiles(delta)
    this.updateGuards(delta)
    this.updateCameras(delta)
    this.renderSightlines()
    this.updateHud()
    this.checkExtraction()
  }

  private createPixelTextures(): void {
    this.createAgentTexture('agent-idle', 0x56d9d1, 0x183a50, false)
    this.createAgentTexture('agent-step', 0x72fff0, 0x183a50, true)
    this.createAgentTexture('guard-idle', 0xffb957, 0x572b32, false)
    this.createCameraTexture()
  }

  private createAgentTexture(key: string, accent: number, coat: number, walking: boolean): void {
    if (this.textures.exists(key)) {
      return
    }

    const graphics = this.add.graphics()
    graphics.fillStyle(0x07111b, 1)
    graphics.fillRect(10, 3, 12, 11)
    graphics.fillStyle(0xdba77d, 1)
    graphics.fillRect(12, 5, 8, 9)
    graphics.fillStyle(accent, 1)
    graphics.fillRect(7, 15, 18, 20)
    graphics.fillStyle(coat, 1)
    graphics.fillRect(5, 19, 5, 14)
    graphics.fillRect(22, 19, 5, 14)
    graphics.fillStyle(0x0d1925, 1)
    graphics.fillRect(9, 34, 6, 15)
    graphics.fillRect(18, 34, 6, 15)
    graphics.fillStyle(0x9dfff5, 1)
    graphics.fillRect(10, 19, 4, 5)
    graphics.fillStyle(0x05080d, 1)
    graphics.fillRect(7, 48, walking ? 10 : 7, 3)
    graphics.fillRect(walking ? 18 : 19, 48, walking ? 7 : 8, 3)
    graphics.generateTexture(key, 32, 52)
    graphics.destroy()
  }

  private createCameraTexture(): void {
    if (this.textures.exists('security-camera')) {
      return
    }

    const graphics = this.add.graphics()
    graphics.fillStyle(0x0a121f, 1)
    graphics.fillRect(0, 5, 30, 12)
    graphics.fillStyle(0x4e657d, 1)
    graphics.fillRect(4, 7, 24, 8)
    graphics.fillStyle(0x7affef, 1)
    graphics.fillRect(20, 8, 6, 6)
    graphics.fillStyle(0xffc65e, 1)
    graphics.fillRect(2, 0, 7, 6)
    graphics.generateTexture('security-camera', 30, 20)
    graphics.destroy()
  }

  private createMoodLayers(): void {
    this.shadowPatches.forEach((patch) => {
      this.add.rectangle(patch.x, patch.y, patch.width, patch.height, 0x02060c, 0.34).setDepth(3)
    })

    this.add.rectangle(640, 710, 1280, 20, 0x02060c, 0.42).setDepth(4)
    this.add.rectangle(82, 650, 12, 512, 0x02060c, 0.35).setDepth(4)
    this.fovGraphics = this.add.graphics().setDepth(8)
    this.noiseGraphics = this.add.graphics().setDepth(29)
    this.aimGraphics = this.add.graphics().setDepth(31)
  }

  private createPlatforms(): void {
    const definitions = [
      { x: 640, y: 650, width: 1065 },
      { x: 640, y: 479, width: 1000 },
      { x: 640, y: 343, width: 1002 },
      { x: 640, y: 216, width: 1070 },
    ]

    definitions.forEach((definition) => {
      const platform = this.add.rectangle(definition.x, definition.y, definition.width, 16, 0x000000, 0)
      this.physics.add.existing(platform, true)
      this.floorPlatforms.push(platform)
    })
  }

  private createInteractables(): void {
    this.keycard = this.createKeycard(556, 446)
    this.securityConsole = this.createConsole(860, 312)
    this.ventEntry = this.createVent(694, 448)

    this.exitDoor = this.add.rectangle(1026, 181, 31, 68, 0x071320, 0.76).setStrokeStyle(2, 0x4e90a1).setDepth(9)
    this.physics.add.existing(this.exitDoor, true)
    this.exitDoorBody = this.exitDoor.body as Phaser.Physics.Arcade.StaticBody

    this.exitBeacon = this.add.circle(1145, 156, 6, 0x70fff2, 0.95).setDepth(14)
    this.add.circle(1145, 156, 15, 0x70fff2, 0.16).setDepth(13)
    this.add
      .text(1121, 126, 'B', { color: '#9ffff5', fontFamily: 'monospace', fontSize: '20px', fontStyle: 'bold' })
      .setDepth(15)
    this.add
      .text(256, 594, 'A', { color: '#ffcf72', fontFamily: 'monospace', fontSize: '20px', fontStyle: 'bold' })
      .setDepth(15)

    this.tweens.add({
      targets: this.exitBeacon,
      alpha: { from: 0.35, to: 1 },
      duration: 680,
      yoyo: true,
      repeat: -1,
    })
  }

  private createKeycard(x: number, y: number): Phaser.GameObjects.Container {
    const card = this.add.rectangle(0, 0, 19, 12, 0x8efbf0).setStrokeStyle(2, 0x153249)
    const stripe = this.add.rectangle(3, 0, 3, 12, 0x142435)
    const glow = this.add.circle(0, 0, 16, 0x54e3d7, 0.15)
    const container = this.add.container(x, y, [glow, card, stripe]).setDepth(17)

    this.tweens.add({ targets: container, y: y - 4, duration: 950, yoyo: true, repeat: -1 })
    return container
  }

  private createConsole(x: number, y: number): Phaser.GameObjects.Container {
    const base = this.add.rectangle(0, 0, 20, 31, 0x0a1725).setStrokeStyle(2, 0x5fa2b5)
    const monitor = this.add.rectangle(0, -6, 13, 8, 0x41ddd3).setStrokeStyle(1, 0xc1fff9)
    const led = this.add.circle(5, 7, 2, 0xffb957)
    return this.add.container(x, y, [base, monitor, led]).setDepth(16)
  }

  private createVent(x: number, y: number): Phaser.GameObjects.Container {
    const frame = this.add.rectangle(0, 0, 36, 21, 0x102a37).setStrokeStyle(2, 0x6ba6b2)
    const slats = [
      this.add.rectangle(0, -6, 27, 2, 0x8dc8c9),
      this.add.rectangle(0, 0, 27, 2, 0x8dc8c9),
      this.add.rectangle(0, 6, 27, 2, 0x8dc8c9),
    ]
    return this.add.container(x, y, [frame, ...slats]).setDepth(16)
  }

  private createPlayer(): void {
    this.player = this.physics.add.sprite(285, 620, 'agent-idle').setDepth(24)
    this.playerBody = this.player.body as Phaser.Physics.Arcade.Body
    this.playerBody.setSize(20, 45).setOffset(6, 5)
    this.playerBody.setDragX(1500)
    this.playerBody.setMaxVelocity(WALK_SPEED, 700)
    this.playerBody.setCollideWorldBounds(true)

    this.floorPlatforms.forEach((platform) => this.physics.add.collider(this.player, platform))
    this.physics.add.collider(this.player, this.exitDoor)
  }

  private createGuards(): void {
    this.guards = [
      this.createGuard(880, 618, 742, 1054),
      this.createGuard(534, 447, 466, 814),
      this.createGuard(610, 311, 410, 805),
      this.createGuard(820, 184, 712, 972),
    ]
  }

  private createGuard(x: number, y: number, patrolStart: number, patrolEnd: number): Guard {
    const sprite = this.physics.add.sprite(x, y, 'guard-idle').setDepth(23)
    const body = sprite.body as Phaser.Physics.Arcade.Body
    body.setSize(20, 45).setOffset(6, 5)
    body.setDragX(1100)
    body.setCollideWorldBounds(true)
    this.floorPlatforms.forEach((platform) => this.physics.add.collider(sprite, platform))

    const label = this.add
      .text(x, y - 41, '', { color: '#ffe2aa', fontFamily: 'monospace', fontSize: '13px', fontStyle: 'bold' })
      .setOrigin(0.5)
      .setDepth(27)

    return {
      body,
      detection: 0,
      direction: -1,
      label,
      patrolEnd,
      patrolStart,
      sprite,
      state: 'patrol',
      targetX: null,
    }
  }

  private createCameras(): void {
    this.securityCameras = [
      this.createCamera(902, 287, -1, 343, 248),
      this.createCamera(680, 160, 1, 216, 258),
      this.createCamera(1010, 452, -1, 479, 210),
    ]
  }

  private createCamera(x: number, y: number, direction: 1 | -1, floorY: number, range: number): SecurityCamera {
    const sprite = this.add.sprite(x, y, 'security-camera').setDepth(13)
    sprite.setFlipX(direction < 0)
    return { detection: 0, direction, floorY, range, sprite }
  }

  private createInput(): void {
    const keyboard = this.input.keyboard

    if (keyboard === null) {
      throw new Error('Keyboard input is required for Shadowline.')
    }

    this.keys = keyboard.addKeys({
      crouch: Phaser.Input.Keyboard.KeyCodes.S,
      interact: Phaser.Input.Keyboard.KeyCodes.R,
      jump: Phaser.Input.Keyboard.KeyCodes.SPACE,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      up: Phaser.Input.Keyboard.KeyCodes.W,
      weapon: Phaser.Input.Keyboard.KeyCodes.T,
    }) as typeof this.keys
  }

  private createHud(): void {
    const panel = this.add.rectangle(640, 34, 1226, 50, 0x030913, 0.82).setStrokeStyle(1, 0x2b6d7b).setScrollFactor(0).setDepth(50)
    panel.setOrigin(0.5)

    this.add
      .text(34, 18, 'SHADOWLINE // NIGHTSHIFT', {
        color: '#9dfff2',
        fontFamily: 'monospace',
        fontSize: '17px',
        fontStyle: 'bold',
      })
      .setScrollFactor(0)
      .setDepth(51)
    this.hudObjective = this.add
      .text(34, 42, '', { color: '#d5f9f5', fontFamily: 'monospace', fontSize: '12px' })
      .setScrollFactor(0)
      .setDepth(51)
    this.hudAlert = this.add
      .text(966, 19, '', { color: '#8affed', fontFamily: 'monospace', fontSize: '12px', fontStyle: 'bold' })
      .setScrollFactor(0)
      .setDepth(51)
    this.hudWeapon = this.add
      .text(966, 40, '', { color: '#d5f9f5', fontFamily: 'monospace', fontSize: '12px' })
      .setScrollFactor(0)
      .setDepth(51)

    this.interactionText = this.add
      .text(640, 681, '', {
        color: '#fff0bd',
        fontFamily: 'monospace',
        fontSize: '15px',
        fontStyle: 'bold',
        stroke: '#02060c',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(51)
    this.toast = this.add
      .text(640, 80, '', {
        align: 'center',
        color: '#dffdf9',
        fontFamily: 'monospace',
        fontSize: '14px',
        stroke: '#02060c',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(52)
  }

  private updatePlayer(): void {
    const direction = Number(this.keys.right.isDown) - Number(this.keys.left.isDown)
    const nearClimb = this.findClimbZone()

    if (!this.isClimbing && nearClimb !== undefined && (this.keys.up.isDown || (this.keys.crouch.isDown && !this.playerBody.blocked.down))) {
      this.beginClimb(nearClimb)
    }

    if (this.isClimbing) {
      this.updateClimb(direction)
      return
    }

    const grounded = this.playerBody.blocked.down || this.playerBody.touching.down
    const shouldCrouch = this.keys.crouch.isDown && grounded && !this.keys.up.isDown
    this.setPlayerCrouching(shouldCrouch)
    const speed = this.playerCrouching ? CRAWL_SPEED : WALK_SPEED
    this.playerMovement = direction === 0 ? 'idle' : 'walk'
    this.playerBody.setVelocityX(direction * speed)

    if (direction !== 0) {
      this.player.setFlipX(direction < 0)
      this.player.setTexture(this.playerMovement === 'walk' && Math.floor(this.time.now / 130) % 2 === 0 ? 'agent-step' : 'agent-idle')
    } else {
      this.player.setTexture('agent-idle')
    }

    if (grounded && Phaser.Input.Keyboard.JustDown(this.keys.jump) && !this.playerCrouching) {
      this.playerBody.setVelocityY(-490)
      this.emitNoise(this.player.x, this.player.y, 165, 'Saut : bruit local')
    }

    if (grounded && direction !== 0 && this.time.now >= this.nextFootstepAt) {
      const radius = calculateNoiseRadius({
        crouching: this.playerCrouching,
        movement: 'walk',
        surfaceMultiplier: 0.8,
      })
      this.emitNoise(this.player.x, this.player.y, radius)
      this.nextFootstepAt = this.time.now + (this.playerCrouching ? 920 : 570)
    }
  }

  private beginClimb(zone: ClimbZone): void {
    this.currentClimbZone = zone
    this.isClimbing = true
    this.playerBody.setAllowGravity(false)
    this.playerBody.checkCollision.none = true
    this.playerBody.setVelocity(0, 0)
    this.player.x = zone.x
    this.showToast(`${zone.label.toUpperCase()} — W/S POUR MONTER OU DESCENDRE`, 1500)
  }

  private updateClimb(direction: number): void {
    const zone = this.currentClimbZone

    if (zone === null) {
      this.stopClimb(direction)
      return
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.jump) || direction !== 0) {
      this.stopClimb(direction)
      return
    }

    const verticalDirection = Number(this.keys.crouch.isDown) - Number(this.keys.up.isDown)
    this.playerBody.setVelocity(0, verticalDirection * CLIMB_SPEED)
    this.player.x = Phaser.Math.Linear(this.player.x, zone.x, 0.28)

    if (this.player.y < zone.yMin || this.player.y > zone.yMax) {
      this.stopClimb(0)
    }
  }

  private stopClimb(direction: number): void {
    this.isClimbing = false
    this.currentClimbZone = null
    this.playerBody.setAllowGravity(true)
    this.playerBody.checkCollision.none = false
    this.playerBody.setVelocity(0, 0)
    const floor = FLOOR_LINES.reduce((closest, candidate) =>
      Math.abs(candidate - this.player.y) < Math.abs(closest - this.player.y) ? candidate : closest,
    )

    if (Math.abs(floor - this.player.y) < 48) {
      this.player.setPosition(this.player.x + direction * 38, floor - 29)
    }
  }

  private setPlayerCrouching(nextValue: boolean): void {
    if (this.playerCrouching === nextValue) {
      return
    }

    this.playerCrouching = nextValue
    this.player.setScale(1, nextValue ? 0.68 : 1)
    this.playerBody.setSize(20, nextValue ? 31 : 45).setOffset(6, nextValue ? 19 : 5)
  }

  private findClimbZone(): ClimbZone | undefined {
    return this.climbZones.find(
      (zone) => Math.abs(this.player.x - zone.x) < 34 && this.player.y >= zone.yMin - 8 && this.player.y <= zone.yMax + 8,
    )
  }

  private updateWeapon(): void {
    if (Phaser.Input.Keyboard.JustDown(this.keys.weapon)) {
      this.weaponEquipped = !this.weaponEquipped
      this.showToast(this.weaponEquipped ? 'ARME SORTIE — clic droit pour tirer' : 'ARME RANGÉE', 1400)
    }

    const pointer = this.input.activePointer
    if (this.weaponEquipped && pointer.rightButtonDown() && this.time.now >= this.nextShotAt) {
      this.fireWeapon(pointer.worldX, pointer.worldY)
    }

    if (pointer.leftButtonDown() && this.time.now >= this.nextDecoyAt) {
      this.throwDecoy(pointer.worldX, pointer.worldY)
    }

    this.aimGraphics.clear()
    if (!this.weaponEquipped) {
      return
    }

    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y - 10, pointer.worldX, pointer.worldY)
    const endX = this.player.x + Math.cos(angle) * 62
    const endY = this.player.y - 10 + Math.sin(angle) * 62
    this.aimGraphics.lineStyle(2, 0x9dfff2, 0.72)
    this.aimGraphics.lineBetween(this.player.x, this.player.y - 10, endX, endY)
    this.aimGraphics.lineStyle(1, 0xffd67b, 0.9)
    this.aimGraphics.strokeCircle(pointer.worldX, pointer.worldY, 7)
  }

  private fireWeapon(targetX: number, targetY: number): void {
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y - 10, targetX, targetY)
    const muzzleX = this.player.x + Math.cos(angle) * 22
    const muzzleY = this.player.y - 10 + Math.sin(angle) * 22
    const projectile = this.add.rectangle(muzzleX, muzzleY, 8, 3, 0xffe8ae).setDepth(30)
    projectile.setRotation(angle)
    this.projectiles.push({ object: projectile, vx: Math.cos(angle) * 760, vy: Math.sin(angle) * 760, life: 760 })
    this.emitNoise(this.player.x, this.player.y, 560, 'COUP DE FEU — les gardes convergent')
    this.nextShotAt = this.time.now + 240
  }

  private throwDecoy(targetX: number, targetY: number): void {
    const x = Phaser.Math.Clamp(targetX, 90, 1190)
    const y = Phaser.Math.Clamp(targetY, 120, 662)
    this.add.circle(x, y, 4, 0xffc66a).setDepth(29)
    this.emitNoise(x, y, 285, 'Diversion lancée')
    this.nextDecoyAt = this.time.now + 800
  }

  private updateInteractions(): void {
    const interaction = this.getInteraction()
    this.interactionText.setText(interaction?.label ?? 'A/D : déplacer · S : ramper · W : grimper · R : interagir · T : arme · clic gauche : diversion')

    if (interaction !== undefined && Phaser.Input.Keyboard.JustDown(this.keys.interact)) {
      interaction.action()
    }
  }

  private getInteraction(): Interaction | undefined {
    const neutralizable = this.guards.find((guard) => this.canNeutralize(guard))
    if (neutralizable !== undefined) {
      return {
        label: '[R] NEUTRALISER LE GARDE',
        action: () => this.neutralizeGuard(neutralizable, false),
      }
    }

    if (!this.hasKeycard && this.distanceTo(this.keycard.x, this.keycard.y) < 45) {
      return {
        label: '[R] RAMASSER LA CARTE D’ACCÈS',
        action: () => {
          this.hasKeycard = true
          this.keycard.setVisible(false)
          this.showToast('CARTE D’ACCÈS OBTENUE — la porte de sécurité peut être ouverte', 2800)
        },
      }
    }

    if (this.distanceTo(this.securityConsole.x, this.securityConsole.y) < 52) {
      return {
        label: this.alarmDisabled ? 'SÉCURITÉ DÉJÀ DÉSACTIVÉE' : '[R] COUPER CAMÉRAS ET ALARMES',
        action: () => {
          if (!this.alarmDisabled) {
            this.alarmDisabled = true
            this.securityConsole.setAlpha(0.42)
            this.showToast('CAMÉRAS COUPÉES — les alarmes sont neutralisées', 2500)
          }
        },
      }
    }

    if (this.distanceTo(this.ventEntry.x, this.ventEntry.y) < 52) {
      if (!this.playerCrouching) {
        return { label: '[S] S’ACCROUPIR POUR PASSER DANS LA VENTILATION', action: () => undefined }
      }

      return {
        label: '[R] RAMPEZ DANS LA VENTILATION',
        action: () => {
          this.player.setPosition(1092, 181)
          this.showToast('RACCOURCI : conduit de ventilation vers le toit', 2200)
        },
      }
    }

    if (!this.exitDoorOpen && this.distanceTo(this.exitDoor.x, this.exitDoor.y) < 48) {
      return {
        label: this.hasKeycard ? '[R] OUVRIR LA PORTE SÉCURISÉE' : 'PORTE SÉCURISÉE — carte d’accès requise',
        action: () => {
          if (this.hasKeycard) {
            this.exitDoorOpen = true
            this.exitDoor.setVisible(false)
            this.exitDoorBody.enable = false
            this.showToast('PORTE SÉCURISÉE OUVERTE', 1700)
          }
        },
      }
    }

    return undefined
  }

  private updateProjectiles(delta: number): void {
    this.projectiles = this.projectiles.filter((projectile) => {
      projectile.life -= delta
      projectile.object.x += projectile.vx * (delta / 1000)
      projectile.object.y += projectile.vy * (delta / 1000)

      const hitGuard = this.guards.find(
        (guard) => guard.state !== 'down' && Phaser.Math.Distance.Between(projectile.object.x, projectile.object.y, guard.sprite.x, guard.sprite.y) < 22,
      )
      if (hitGuard !== undefined) {
        this.neutralizeGuard(hitGuard, true)
        projectile.object.destroy()
        return false
      }

      const alive = projectile.life > 0 && projectile.object.x > 0 && projectile.object.x < VIEWPORT_WIDTH && projectile.object.y > 0 && projectile.object.y < VIEWPORT_HEIGHT
      if (!alive) {
        projectile.object.destroy()
      }
      return alive
    })
  }

  private updateNoise(delta: number): void {
    this.noisePulses.forEach((pulse) => {
      pulse.age += delta
    })
    this.noisePulses = this.noisePulses.filter((pulse) => pulse.age < 760)

    this.noiseGraphics.clear()
    this.noisePulses.forEach((pulse) => {
      const progress = pulse.age / 760
      this.noiseGraphics.lineStyle(2, 0xffc66a, 0.72 * (1 - progress))
      this.noiseGraphics.strokeCircle(pulse.x, pulse.y, pulse.radius * progress)
    })
  }

  private emitNoise(x: number, y: number, radius: number, message?: string): void {
    if (radius > 0) {
      this.noisePulses.push({ age: 0, radius, x, y })
    }
    this.guards.forEach((guard) => {
      if (guard.state === 'down') {
        return
      }
      const sameFloor = Math.abs(guard.sprite.y - y) < 86
      if (sameFloor && Phaser.Math.Distance.Between(x, y, guard.sprite.x, guard.sprite.y) <= radius) {
        guard.state = guard.state === 'alert' ? 'alert' : 'investigate'
        guard.targetX = x
      }
    })

    if (message !== undefined) {
      this.showToast(message, 1200)
    }
  }

  private updateGuards(delta: number): void {
    const elapsedSeconds = delta / 1000
    const exposure = this.getPlayerExposure()

    this.guards.forEach((guard) => {
      if (guard.state === 'down') {
        return
      }

      const dx = this.player.x - guard.sprite.x
      const dy = Math.abs(this.player.y - guard.sprite.y)
      const canSee = dy < 64 && dx * guard.direction > 0 && Math.abs(dx) < 255
      guard.detection = nextDetectionLevel(guard.detection, exposure, canSee, elapsedSeconds)

      if (guard.detection > 0.84) {
        guard.state = 'alert'
        guard.targetX = this.player.x
        this.alertState = 'alarm'
      } else if (guard.detection > 0.22 && guard.state === 'patrol') {
        guard.state = 'investigate'
        guard.targetX = this.player.x
      }

      this.moveGuard(guard)
      this.renderGuard(guard)

      if (guard.state === 'alert' && Phaser.Math.Distance.Between(this.player.x, this.player.y, guard.sprite.x, guard.sprite.y) < 38) {
        this.finishMission(false)
      }
    })
  }

  private moveGuard(guard: Guard): void {
    if (guard.state === 'patrol') {
      if (guard.sprite.x <= guard.patrolStart) {
        guard.direction = 1
      } else if (guard.sprite.x >= guard.patrolEnd) {
        guard.direction = -1
      }
      guard.body.setVelocityX(guard.direction * 62)
    } else if (guard.targetX !== null) {
      const dx = guard.targetX - guard.sprite.x
      if (Math.abs(dx) < 12 && guard.state === 'investigate') {
        guard.state = 'patrol'
        guard.targetX = null
        guard.detection = Math.min(guard.detection, 0.18)
        guard.body.setVelocityX(0)
      } else {
        guard.direction = dx >= 0 ? 1 : -1
        guard.body.setVelocityX(guard.direction * (guard.state === 'alert' ? 122 : 84))
      }
    }
    guard.sprite.setFlipX(guard.direction < 0)
  }

  private renderGuard(guard: Guard): void {
    const visuals: Record<GuardState, { color: number; label: string }> = {
      patrol: { color: 0xffffff, label: '' },
      investigate: { color: 0xffd37a, label: '?' },
      alert: { color: 0xff7d7d, label: '!' },
      down: { color: 0x617181, label: '×' },
    }
    const visual = visuals[guard.state]
    guard.sprite.setTint(visual.color)
    guard.label.setText(visual.label).setPosition(guard.sprite.x, guard.sprite.y - 42)
    guard.label.setColor(guard.state === 'alert' ? '#ff8e91' : '#ffe3ad')
  }

  private updateCameras(delta: number): void {
    const elapsedSeconds = delta / 1000
    const exposure = this.getPlayerExposure()
    this.securityCameras.forEach((camera, index) => {
      const sweepingRight = Math.sin(this.time.now / 900 + index * 1.7) > 0
      camera.direction = sweepingRight ? 1 : -1
      camera.sprite.setFlipX(camera.direction < 0)

      if (this.alarmDisabled) {
        camera.sprite.setAlpha(0.35)
        camera.detection = 0
        return
      }

      const dx = this.player.x - camera.sprite.x
      const dy = Math.abs(this.player.y - camera.floorY)
      const canSee = dy < 66 && dx * camera.direction > 0 && Math.abs(dx) < camera.range
      camera.detection = nextDetectionLevel(camera.detection, exposure, canSee, elapsedSeconds)
      if (camera.detection > 0.7) {
        this.alertState = 'alarm'
      }
    })
  }

  private renderSightlines(): void {
    this.fovGraphics.clear()
    this.guards.forEach((guard) => {
      if (guard.state === 'down') {
        return
      }
      const range = guard.state === 'alert' ? 280 : 235
      const color = guard.state === 'alert' ? 0xff4058 : 0xffc66a
      this.fovGraphics.fillStyle(color, guard.state === 'alert' ? 0.1 : 0.06)
      this.fovGraphics.fillTriangle(
        guard.sprite.x,
        guard.sprite.y - 14,
        guard.sprite.x + guard.direction * range,
        guard.sprite.y - 60,
        guard.sprite.x + guard.direction * range,
        guard.sprite.y + 38,
      )
    })
    this.securityCameras.forEach((camera) => {
      if (this.alarmDisabled) {
        return
      }
      this.fovGraphics.fillStyle(0x50ffe2, 0.075)
      this.fovGraphics.fillTriangle(
        camera.sprite.x,
        camera.sprite.y + 5,
        camera.sprite.x + camera.direction * camera.range,
        camera.floorY - 44,
        camera.sprite.x + camera.direction * camera.range,
        camera.floorY + 36,
      )
    })
  }

  private canNeutralize(guard: Guard): boolean {
    if (guard.state === 'down' || guard.state === 'alert') {
      return false
    }
    const dx = this.player.x - guard.sprite.x
    return Math.abs(dx) < 45 && Math.abs(this.player.y - guard.sprite.y) < 46 && dx * guard.direction < 0
  }

  private neutralizeGuard(guard: Guard, fromWeapon: boolean): void {
    guard.state = 'down'
    guard.detection = 0
    guard.targetX = null
    guard.body.setVelocity(0, 0)
    guard.body.enable = false
    guard.sprite.setTint(0x607384).setAngle(90)
    guard.label.setText('×').setColor('#a9bdc7')
    this.showToast(fromWeapon ? 'GARDE NEUTRALISÉ — tir entendu' : 'GARDE NEUTRALISÉ EN SILENCE', 1500)
  }

  private getPlayerExposure(): number {
    return calculateExposure({
      crouching: this.playerCrouching,
      inShadow: this.isInShadow(),
      lightsEnabled: true,
      movement: this.playerMovement,
    })
  }

  private isInShadow(): boolean {
    return this.shadowPatches.some(
      (patch) =>
        this.player.x >= patch.x - patch.width / 2 &&
        this.player.x <= patch.x + patch.width / 2 &&
        this.player.y >= patch.y - patch.height / 2 &&
        this.player.y <= patch.y + patch.height / 2,
    )
  }

  private checkExtraction(): void {
    if (this.distanceTo(this.exitBeacon.x, this.exitBeacon.y + 30) < 48) {
      this.finishMission(true)
    }
  }

  private distanceTo(x: number, y: number): number {
    return Phaser.Math.Distance.Between(this.player.x, this.player.y, x, y)
  }

  private updateHud(): void {
    const maxGuardDetection = Math.max(0, ...this.guards.map((guard) => guard.detection))
    const maxCameraDetection = Math.max(0, ...this.securityCameras.map((camera) => camera.detection))
    const detection = Math.max(maxGuardDetection, maxCameraDetection)
    if (this.alarmDisabled && detection === 0) {
      this.alertState = 'calm'
    } else if (this.alertState !== 'alarm') {
      this.alertState = detection > 0.2 ? 'suspicion' : 'calm'
    }

    const alertCopy: Record<AlertState, string> = {
      calm: 'ÉTAT : CALME',
      suspicion: 'ÉTAT : SUSPICION',
      alarm: 'ÉTAT : ALARME',
    }
    const alertColor: Record<AlertState, string> = {
      calm: '#8affed',
      suspicion: '#ffdd8a',
      alarm: '#ff9095',
    }
    const objective = this.exitDoorOpen || this.hasKeycard
      ? 'B : atteindre la balise d’extraction au toit'
      : 'A → B : infiltration verticale — carte, ventilation ou escalier extérieur'

    this.hudObjective.setText(objective)
    this.hudAlert.setText(`${alertCopy[this.alertState]}  ${Math.round(detection * 100)}%`).setColor(alertColor[this.alertState])
    this.hudWeapon.setText(this.weaponEquipped ? 'ARME : SORTIE  ·  CLIC DROIT : TIR' : 'ARME : RANGÉE  ·  T : SORTIR')
  }

  private showToast(message: string, duration: number): void {
    this.toast.setText(message).setAlpha(1)
    this.tweens.killTweensOf(this.toast)
    this.tweens.add({ targets: this.toast, alpha: 0, delay: duration, duration: 260 })
  }

  private finishMission(success: boolean): void {
    this.hasWon = success
    this.hasLost = !success
    this.playerBody.setVelocity(0, 0)
    this.guards.forEach((guard) => guard.body.setVelocity(0, 0))

    const color = success ? '#8affed' : '#ff9299'
    const title = success ? 'EXFILTRATION RÉUSSIE' : 'MISSION COMPROMISE'
    const subtitle = success
      ? 'Vous avez atteint B. R pour recommencer la mission.'
      : 'Un garde vous a intercepté. R pour recommencer.'
    this.add.rectangle(640, 360, 650, 190, 0x020813, 0.94).setStrokeStyle(3, success ? 0x61dfd6 : 0xd85b66).setDepth(70)
    this.add
      .text(640, 328, title, { color, fontFamily: 'monospace', fontSize: '34px', fontStyle: 'bold' })
      .setOrigin(0.5)
      .setDepth(71)
    this.add
      .text(640, 390, subtitle, { color: '#e4fffb', fontFamily: 'monospace', fontSize: '16px' })
      .setOrigin(0.5)
      .setDepth(71)
  }
}
