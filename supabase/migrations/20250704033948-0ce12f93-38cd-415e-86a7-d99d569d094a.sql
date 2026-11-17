-- Eliminar registros duplicados de servicios para Laura Cabral manteniendo solo los primeros
-- Primero eliminar las deudas asociadas a los servicios duplicados
DELETE FROM public.debts 
WHERE service_id IN (
  'ffbf52d3-7963-4c9a-97ab-17633333d53e',
  '82729012-59ac-4c62-9772-81d6da07d830',
  '1399ed62-ab78-4364-a2f3-d811e06bd0f8',
  '41d8d3c3-8a5a-4bee-8451-8c9e649dae8a',
  '8adb35ea-9bc3-4614-90b8-296b12e3bd95',
  '9d0a979c-6daa-46c3-8ca3-28b5e5b38434',
  'd2e26a18-024b-4707-8f2a-f9fbad31a745',
  '424e69f7-dcbc-4cc5-88c9-5aad6c247d13',
  '71d8379f-5f74-4ae4-af9c-5e1d58ecf435',
  'b5f9d953-46ac-48e0-b61d-4efe68aa5817',
  '72dcaf0c-8864-4c2b-8315-6f10b622164a'
);

-- Eliminar los cheques asociados
DELETE FROM public.cheques 
WHERE service_id IN (
  'ffbf52d3-7963-4c9a-97ab-17633333d53e',
  '82729012-59ac-4c62-9772-81d6da07d830',
  '1399ed62-ab78-4364-a2f3-d811e06bd0f8',
  '41d8d3c3-8a5a-4bee-8451-8c9e649dae8a',
  '8adb35ea-9bc3-4614-90b8-296b12e3bd95',
  '9d0a979c-6daa-46c3-8ca3-28b5e5b38434',
  'd2e26a18-024b-4707-8f2a-f9fbad31a745',
  '424e69f7-dcbc-4cc5-88c9-5aad6c247d13',
  '71d8379f-5f74-4ae4-af9c-5e1d58ecf435',
  'b5f9d953-46ac-48e0-b61d-4efe68aa5817',
  '72dcaf0c-8864-4c2b-8315-6f10b622164a'
);

-- Eliminar los servicios duplicados
DELETE FROM public.services 
WHERE id IN (
  'ffbf52d3-7963-4c9a-97ab-17633333d53e',
  '82729012-59ac-4c62-9772-81d6da07d830',
  '1399ed62-ab78-4364-a2f3-d811e06bd0f8',
  '41d8d3c3-8a5a-4bee-8451-8c9e649dae8a',
  '8adb35ea-9bc3-4614-90b8-296b12e3bd95',
  '9d0a979c-6daa-46c3-8ca3-28b5e5b38434',
  'd2e26a18-024b-4707-8f2a-f9fbad31a745',
  '424e69f7-dcbc-4cc5-88c9-5aad6c247d13',
  '71d8379f-5f74-4ae4-af9c-5e1d58ecf435',
  'b5f9d953-46ac-48e0-b61d-4efe68aa5817',
  '72dcaf0c-8864-4c2b-8315-6f10b622164a'
);