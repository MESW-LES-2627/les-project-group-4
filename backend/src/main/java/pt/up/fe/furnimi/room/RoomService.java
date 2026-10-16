package pt.up.fe.furnimi.room;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

@Service
@Validated
@RequiredArgsConstructor
public class RoomService {

	private final RoomRepository roomRepository;

	@Transactional
	public RoomResponse createRoom(@Valid CreateRoomRequest request) {
		Room room = new Room(request.name().trim(), request.widthCm(), request.lengthCm());
		return RoomResponse.from(roomRepository.save(room));
	}

}
