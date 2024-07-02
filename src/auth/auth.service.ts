import { ForbiddenException, Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { AuthDto } from './dto'
import * as argon from 'argon2'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}
  async signin(dto: AuthDto) {
    // find user by email
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    })

    if (!user) throw new ForbiddenException('User not found')

    //continue

    const passwordMatches = argon.verify(user.hash, dto.password)

    if (!passwordMatches) throw new ForbiddenException('Invalid password')

    delete user.hash
    return user
  }

  async signup(dto: AuthDto) {
    // password hash generation
    const hash = await argon.hash(dto.password)
    // save user into db

    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          hash,
        },
        select: {
          id: true,
          email: true,
          createdAt: true,
        },
      })
      return user
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Email already exist')
        }
      }
    }
  }
  // return user
}
