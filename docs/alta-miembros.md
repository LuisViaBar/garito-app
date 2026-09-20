# Alta manual de un miembro (Fase 1 — grupo de prueba)

Proceso para dar de alta a cada persona del grupo controlado de pruebas. Dos pasos, los dos
en el panel de Supabase. No requiere tocar código.

## 1. Crear el usuario de autenticación

En el dashboard de Supabase → **Authentication → Users → Add user**:

- Email: el suyo real (donde va a recibir credenciales/avisos).
- Password: una contraseña provisional (pásasela tú por un canal aparte; que la cambie
  cuando quieras dar a esto más entidad — el cambio de contraseña lo gestiona Supabase Auth).
- Marca **Auto Confirm User** para que pueda entrar sin tener que confirmar el email.

## 2. Vincular su fila en `miembros`

En **SQL Editor**, ejecuta (sustituyendo los valores):

```sql
insert into public.miembros (auth_user_id, nombre, alias, email, rol, activo)
select id, 'Nombre Completo', 'Alias', 'email@ejemplo.com', 'miembro', true
from auth.users
where email = 'email@ejemplo.com';
```

- `rol`: `'miembro'` para todos salvo tú mismo como `'admin'`.
- El `select ... from auth.users where email = ...` evita tener que copiar el UUID a mano.

## Verificación

```sql
select alias, email, rol, activo from public.miembros order by created_at;
```

Si la fila no aparece, revisa que el email coincida exactamente (sin espacios) con el que
usaste al crear el usuario en el paso 1.
