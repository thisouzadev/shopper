import { IsString, IsNotEmpty, IsUUID, IsInt } from 'class-validator';

export class ConfirmMeasureDto {
  @IsUUID()
  @IsNotEmpty()
  @IsString()
  measure_uuid: string;

  @IsInt()
  @IsNotEmpty()
  confirmed_value: number;
}
