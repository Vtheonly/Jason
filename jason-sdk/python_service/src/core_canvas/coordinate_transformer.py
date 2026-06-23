class CoordinateTransformer:
    # 1 Inch is exactly equivalent to 914,400 English Metric Units (EMU)
    EMU_PER_INCH = 914400
    # 1 Centimeter is exactly equivalent to 360,000 EMU
    EMU_PER_CM = 360000
    # PT (Point scale) values used by fonts. 72 Points = 1 Inch
    Pt_PER_INCH = 72

    @classmethod
    def inches_to_emu(cls, value):
        return int(value * cls.EMU_PER_INCH)

    @classmethod
    def emu_to_inches(cls, value):
        return float(value) / cls.EMU_PER_INCH

    @classmethod
    def cm_to_emu(cls, value):
        return int(value * cls.EMU_PER_CM)

    @classmethod
    def emu_to_cm(cls, value):
        return float(value) / cls.EMU_PER_CM

    @classmethod
    def points_to_emu(cls, points_value):
        # 1 Pt = 12,700 EMU
        return int(points_value * 12700)