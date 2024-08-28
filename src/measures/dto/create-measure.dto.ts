import { IsString, IsNotEmpty, IsEnum, IsDateString } from 'class-validator';

enum MeasureType {
  WATER = 'WATER',
  GAS = 'GAS',
}

export class CreateMeasureDto {
  @IsString()
  @IsNotEmpty()
  customer_code: string;

  @IsDateString()
  @IsNotEmpty()
  measure_datetime: string;

  @IsEnum(MeasureType)
  @IsNotEmpty()
  measure_type: MeasureType;
}
