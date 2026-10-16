package pt.up.fe.furnimi.room;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record CreateRoomRequest(
		@NotBlank(message = "Name is required")
		@Size(max = 255, message = "Name must be at most 255 characters")
		String name,

		@NotNull(message = "Width is required")
		@Positive(message = "Width must be a positive number of centimetres")
		Integer widthCm,

		@NotNull(message = "Length is required")
		@Positive(message = "Length must be a positive number of centimetres")
		Integer lengthCm
) {
}
