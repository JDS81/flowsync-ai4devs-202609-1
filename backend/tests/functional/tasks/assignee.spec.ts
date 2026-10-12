import User from '#models/user'
import Task from '#models/task'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'

/**
 * Lo que cada tarea muestra de su responsable. Cubre el requisito «Lo que cada
 * tarea muestra de su responsable» de `openspec/specs/tasks/spec.md`, con su
 * segundo scenario partido en dos: tarea suelta y tarea dentro de la lista.
 */
test.group('Tasks | responsable', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  /** Datos de la cuenta que nunca deben viajar junto a una tarea. */
  const DATOS_DE_ACCESO = ['email', 'password']

  async function sesion(client: any) {
    await User.create({
      fullName: 'Grace Hopper',
      email: 'grace@example.com',
      password: 'secreto123',
    })

    const response = await client
      .post('/api/v1/auth/login')
      .json({ email: 'grace@example.com', password: 'secreto123' })

    return response.body().data.token as string
  }

  /** Una tarea pendiente a nombre de una cuenta nueva, para que salga en la lista por defecto. */
  async function tareaDe(fullName: string | null, email: string) {
    const responsable = await User.create({ fullName, email, password: 'secreto123' })
    return Task.create({
      title: 'Revisar el informe',
      status: 'pending',
      assigneeId: responsable.id,
    })
  }

  test('una tarea trae el nombre y las iniciales de su responsable', async ({ client, assert }) => {
    const token = await sesion(client)
    const tarea = await tareaDe('Ada Lovelace', 'ada@example.com')

    const response = await client
      .get(`/api/v1/tasks/${tarea.id}`)
      .qs({ today: '2026-10-12' })
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)

    const assignee = response.body().data.assignee
    assert.equal(assignee.fullName, 'Ada Lovelace')
    assert.equal(assignee.initials, 'AL')
  })

  test('una tarea suelta no trae el email ni datos de acceso de su responsable', async ({
    client,
    assert,
  }) => {
    const token = await sesion(client)
    const tarea = await tareaDe('Ada Lovelace', 'ada@example.com')

    const response = await client
      .get(`/api/v1/tasks/${tarea.id}`)
      .qs({ today: '2026-10-12' })
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    for (const dato of DATOS_DE_ACCESO) assert.notProperty(response.body().data.assignee, dato)
  })

  test('una tarea dentro de la lista no trae el email ni datos de acceso de su responsable', async ({
    client,
    assert,
  }) => {
    const token = await sesion(client)
    const tarea = await tareaDe('Ada Lovelace', 'ada@example.com')

    const response = await client.get('/api/v1/tasks').header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)

    const enLaLista = response.body().data.find((t: { id: number }) => t.id === tarea.id)
    assert.exists(enLaLista)
    for (const dato of DATOS_DE_ACCESO) assert.notProperty(enLaLista.assignee, dato)
  })

  test('un responsable sin nombre llega con el nombre nulo y con iniciales', async ({
    client,
    assert,
  }) => {
    const token = await sesion(client)
    const tarea = await tareaDe(null, 'ada@example.com')

    const response = await client
      .get(`/api/v1/tasks/${tarea.id}`)
      .qs({ today: '2026-10-12' })
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)

    const assignee = response.body().data.assignee
    assert.property(assignee, 'fullName')
    assert.isNull(assignee.fullName)
    assert.isString(assignee.initials)
    assert.isNotEmpty(assignee.initials)
  })
})
