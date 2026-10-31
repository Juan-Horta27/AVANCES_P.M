import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { AuthService } from './auth.service';
import { Publico } from './decoradores';
import { LoginDto } from './dto/login.dto';
import { RegistroDto } from './dto/registro.dto';
import { Sesion } from './sesion';

/**
 * Endpoints públicos de autenticación (api-contract.md E-01 y E-02).
 * El controlador solo traduce HTTP ↔ servicio; las reglas viven en AuthService
 * y la validación de los datos en los DTO.
 */
@Publico()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  registrar(@Body() datos: RegistroDto): Promise<Sesion> {
    return this.authService.registrar(datos);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  iniciarSesion(@Body() datos: LoginDto): Promise<Sesion> {
    return this.authService.iniciarSesion(datos);
  }
}
