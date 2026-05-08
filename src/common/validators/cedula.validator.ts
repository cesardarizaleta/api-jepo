import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { isValidCedulaVE } from '../utils/cedula.util';

@ValidatorConstraint({ name: 'IsCedula', async: false })
export class IsCedulaConstraint implements ValidatorConstraintInterface {
  validate(value: any, _args?: ValidationArguments): boolean {
    void _args;
    return isValidCedulaVE(value);
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} no es una cédula venezolana válida`;
  }
}

export function IsCedula(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isCedula',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: IsCedulaConstraint,
    });
  };
}
