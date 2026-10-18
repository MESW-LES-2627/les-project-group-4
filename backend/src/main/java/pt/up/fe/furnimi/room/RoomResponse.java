package pt.up.fe.furnimi.room;

public record RoomResponse(Long id, String name, int widthCm, int lengthCm) {

	public static RoomResponse from(Room room) {
		return new RoomResponse(room.getId(), room.getName(), room.getWidthCm(), room.getLengthCm());
	}

}
